import pool from '../../db/client'
import { sendNotification } from '../notifications/notificationService'

export interface MyTeam {
  id: string
  name: string
  description: string
  hackathon_id: string
  hackathon_name: string
  member_count: number
  role: 'owner' | 'member'
}

export async function getMyTeams(userId: string): Promise<MyTeam[]> {
  const result = await pool.query(
    `SELECT t.id, t.name, t.description, t.hackathon_id,
            h.title AS hackathon_name,
            COUNT(tm2.user_id)::int AS member_count,
            tm.role
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     JOIN hackathons h ON h.id = t.hackathon_id
     LEFT JOIN team_members tm2 ON tm2.team_id = t.id
     WHERE tm.user_id = $1
     GROUP BY t.id, h.title, tm.role
     ORDER BY t.created_at DESC`,
    [userId],
  )
  return result.rows
}

export async function createTeam(userId: string, data: any) {
  const { name, description, hackathon_id, max_members, required_skills, is_open } = data
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const teamRes = await client.query(
      `INSERT INTO teams (name, description, hackathon_id, created_by, max_members, required_skills, is_open)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, hackathon_id, userId, max_members ?? 4, required_skills ?? [], is_open ?? true],
    )
    const team = teamRes.rows[0]
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [team.id, userId],
    )
    await client.query('COMMIT')
    return team
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function getTeam(teamId: string) {
  const [teamRes, membersRes] = await Promise.all([
    pool.query('SELECT * FROM teams WHERE id = $1', [teamId]),
    pool.query(
      `SELECT tm.*, p.display_name, p.avatar_url, p.skills
       FROM team_members tm
       JOIN profiles p ON p.user_id = tm.user_id
       WHERE tm.team_id = $1`,
      [teamId],
    ),
  ])
  if (!teamRes.rows[0]) return null
  return { ...teamRes.rows[0], members: membersRes.rows }
}

export async function getTeamsByHackathon(hackathonId: string) {
  const result = await pool.query(
    `SELECT t.*, COUNT(tm.user_id)::int AS member_count
     FROM teams t
     LEFT JOIN team_members tm ON tm.team_id = t.id
     WHERE t.hackathon_id = $1 AND t.is_open = TRUE
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [hackathonId],
  )
  return result.rows
}

export async function updateTeam(teamId: string, userId: string, data: any) {
  const team = await pool.query('SELECT * FROM teams WHERE id = $1', [teamId])
  if (!team.rows[0]) {
    const err = new Error('Team not found.') as Error & { status: number }
    err.status = 404; throw err
  }
  if (team.rows[0].created_by !== userId) {
    const err = new Error('Only the team owner can update the team.') as Error & { status: number }
    err.status = 403; throw err
  }
  const { name, description, required_skills, is_open } = data
  const result = await pool.query(
    `UPDATE teams SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       required_skills = COALESCE($3, required_skills),
       is_open = COALESCE($4, is_open),
       updated_at = NOW()
     WHERE id = $5 RETURNING *`,
    [name, description, required_skills, is_open, teamId],
  )
  return result.rows[0]
}

export async function inviteMember(teamId: string, inviterId: string, inviteeId: string) {
  const teamRes = await pool.query(
    `SELECT t.*, h.max_team_size,
            (SELECT COUNT(*) FROM team_members WHERE team_id = t.id)::int AS member_count
     FROM teams t
     JOIN hackathons h ON h.id = t.hackathon_id
     WHERE t.id = $1`,
    [teamId],
  )
  const team = teamRes.rows[0]
  if (!team) {
    const err = new Error('Team not found.') as Error & { status: number }
    err.status = 404; throw err
  }
  if (team.created_by !== inviterId) {
    const err = new Error('Only the team owner can invite members.') as Error & { status: number }
    err.status = 403; throw err
  }
  if (team.member_count >= team.max_team_size) {
    const err = new Error('Team has reached maximum size.') as Error & { status: number }
    err.status = 422; throw err
  }

  const existing = await pool.query(
    `SELECT id FROM team_invites WHERE team_id = $1 AND invitee_id = $2 AND status = 'PENDING'`,
    [teamId, inviteeId],
  )
  if (existing.rows.length > 0) {
    const err = new Error('Invite already pending for this user.') as Error & { status: number }
    err.status = 409; throw err
  }

  const result = await pool.query(
    `INSERT INTO team_invites (team_id, inviter_id, invitee_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [teamId, inviterId, inviteeId],
  )
  const invite = result.rows[0]

  await sendNotification(inviteeId, 'TEAM_INVITE', { invite, teamName: team.name }).catch(() => {})
  return invite
}

export async function respondToInvite(inviteId: string, userId: string, accept: boolean) {
  const inviteRes = await pool.query(
    `SELECT * FROM team_invites WHERE id = $1 AND invitee_id = $2 AND status = 'PENDING'`,
    [inviteId, userId],
  )
  if (!inviteRes.rows[0]) {
    const err = new Error('Invite not found.') as Error & { status: number }
    err.status = 404; throw err
  }
  const invite = inviteRes.rows[0]

  if (accept) {
    // Check team still has space
    const sizeRes = await pool.query(
      `SELECT t.created_by, h.max_team_size,
              (SELECT COUNT(*) FROM team_members WHERE team_id = t.id)::int AS member_count
       FROM teams t JOIN hackathons h ON h.id = t.hackathon_id WHERE t.id = $1`,
      [invite.team_id],
    )
    const { created_by, max_team_size, member_count } = sizeRes.rows[0]
    if (member_count >= max_team_size) {
      const err = new Error('Team has reached maximum size.') as Error & { status: number }
      err.status = 422; throw err
    }

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        `UPDATE team_invites SET status = 'ACCEPTED', updated_at = NOW() WHERE id = $1`,
        [inviteId],
      )
      await client.query(
        `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')
         ON CONFLICT DO NOTHING`,
        [invite.team_id, userId],
      )
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK'); throw e
    } finally {
      client.release()
    }

    await sendNotification(created_by, 'TEAM_INVITE_ACCEPTED', {
      inviteId, userId, teamId: invite.team_id,
    }).catch(() => {})
  } else {
    await pool.query(
      `UPDATE team_invites SET status = 'DECLINED', updated_at = NOW() WHERE id = $1`,
      [inviteId],
    )
    const teamRes = await pool.query('SELECT created_by FROM teams WHERE id = $1', [invite.team_id])
    await sendNotification(teamRes.rows[0]?.created_by, 'TEAM_INVITE_DECLINED', {
      inviteId, userId, teamId: invite.team_id,
    }).catch(() => {})
  }

  return getTeam(invite.team_id)
}

export async function leaveTeam(teamId: string, userId: string) {
  const result = await pool.query(
    `DELETE FROM team_members WHERE team_id = $1 AND user_id = $2 AND role != 'owner' RETURNING *`,
    [teamId, userId],
  )
  if (result.rows.length === 0) {
    const err = new Error('Not a member of this team, or owner cannot leave.') as Error & { status: number }
    err.status = 400; throw err
  }
}

export async function addMessage(userId: string, teamId: string, content: string) {
  const result = await pool.query(
    `INSERT INTO team_messages (team_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [teamId, userId, content],
  )
  return result.rows[0]
}

export async function getMessages(teamId: string) {
  const result = await pool.query(
    `SELECT tm.*, p.display_name, p.avatar_url
     FROM team_messages tm
     LEFT JOIN profiles p ON tm.user_id = p.user_id
     WHERE tm.team_id = $1
     ORDER BY tm.created_at ASC`,
    [teamId],
  )
  return result.rows
}

export async function createProject(teamId: string, data: any) {
  const { hackathon_id, title, description, repository_url, demo_url } = data
  const result = await pool.query(
    `INSERT INTO projects (team_id, hackathon_id, title, description, repository_url, demo_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [teamId, hackathon_id, title, description, repository_url, demo_url],
  )
  return result.rows[0]
}

export interface PendingInvite {
  id: string
  team_id: string
  team_name: string
  inviter_name: string
  created_at: string
}

export async function getPendingInvites(userId: string): Promise<PendingInvite[]> {
  const result = await pool.query(
    `SELECT ti.id, ti.team_id, t.name AS team_name,
            p.display_name AS inviter_name, ti.created_at
     FROM team_invites ti
     JOIN teams t ON t.id = ti.team_id
     JOIN profiles p ON p.user_id = ti.inviter_id
     WHERE ti.invitee_id = $1 AND ti.status = 'PENDING'
     ORDER BY ti.created_at DESC`,
    [userId],
  )
  return result.rows
}
