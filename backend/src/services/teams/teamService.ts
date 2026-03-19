import pool from '../../db/client';

export async function createTeam(userId: string, data: any) {
  const { name, description, hackathon_id, max_members } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const teamRes = await client.query(
      `INSERT INTO teams (name, description, hackathon_id, created_by, max_members)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, hackathon_id, userId, max_members || 4]
    );
    const team = teamRes.rows[0];
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [team.id, userId]
    );
    await client.query('COMMIT');
    return team;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getTeamsByHackathon(hackathonId: string) {
  const result = await pool.query('SELECT * FROM teams WHERE hackathon_id = $1 AND status = $2', [hackathonId, 'open']);
  return result.rows;
}

export async function joinTeam(userId: string, teamId: string) {
  // Simplistic join implementation
  const result = await pool.query(
    `INSERT INTO team_members (team_id, user_id, role)
     VALUES ($1, $2, 'member') RETURNING *`,
    [teamId, userId]
  );
  return result.rows[0];
}

export async function addMessage(userId: string, teamId: string, content: string) {
  const result = await pool.query(
    `INSERT INTO team_messages (team_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [teamId, userId, content]
  );
  return result.rows[0];
}

export async function getMessages(teamId: string) {
  const result = await pool.query(
    `SELECT tm.*, p.display_name 
     FROM team_messages tm
     LEFT JOIN profiles p ON tm.user_id = p.user_id
     WHERE tm.team_id = $1 
     ORDER BY tm.created_at ASC`,
    [teamId]
  );
  return result.rows;
}

export async function createProject(teamId: string, data: any) {
  const { hackathon_id, title, description, repository_url, demo_url } = data;
  const result = await pool.query(
    `INSERT INTO projects (team_id, hackathon_id, title, description, repository_url, demo_url)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [teamId, hackathon_id, title, description, repository_url, demo_url]
  );
  return result.rows[0];
}
