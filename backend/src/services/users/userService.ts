import pool from '../../db/client'
import { sendNotification } from '../notifications/notificationService'

export async function getProfile(userId: string) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId])
  return result.rows[0] ?? null
}

export async function upsertProfile(userId: string, data: any) {
  const {
    display_name, bio, skills, interests, experience_level,
    availability, timezone, avatar_url, github_url, linkedin_url, portfolio_url,
  } = data

  const result = await pool.query(
    `INSERT INTO profiles (
       user_id, display_name, bio, skills, interests, experience_level,
       availability, timezone, avatar_url, github_url, linkedin_url, portfolio_url, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       display_name   = EXCLUDED.display_name,
       bio            = EXCLUDED.bio,
       skills         = EXCLUDED.skills,
       interests      = EXCLUDED.interests,
       experience_level = EXCLUDED.experience_level,
       availability   = EXCLUDED.availability,
       timezone       = EXCLUDED.timezone,
       avatar_url     = EXCLUDED.avatar_url,
       github_url     = EXCLUDED.github_url,
       linkedin_url   = EXCLUDED.linkedin_url,
       portfolio_url  = EXCLUDED.portfolio_url,
       updated_at     = NOW()
     RETURNING *`,
    [userId, display_name, bio, skills, interests, experience_level,
     availability, timezone, avatar_url, github_url, linkedin_url, portfolio_url],
  )
  return result.rows[0]
}

export async function getConnections(userId: string) {
  const result = await pool.query(
    `SELECT p.* FROM profiles p
     JOIN connection_requests cr ON (
       (cr.from_user_id = $1 AND cr.to_user_id = p.user_id) OR
       (cr.to_user_id = $1 AND cr.from_user_id = p.user_id)
     )
     WHERE cr.status = 'ACCEPTED'`,
    [userId],
  )
  return result.rows
}

export async function sendConnectionRequest(fromId: string, toId: string, message: string) {
  if (fromId === toId) {
    const err = new Error('Cannot connect with yourself.') as Error & { status: number }
    err.status = 400
    throw err
  }

  // Check for existing connection or pending request
  const existing = await pool.query(
    `SELECT id FROM connection_requests
     WHERE (from_user_id = $1 AND to_user_id = $2)
        OR (from_user_id = $2 AND to_user_id = $1)`,
    [fromId, toId],
  )
  if (existing.rows.length > 0) {
    const err = new Error('Connection already exists or is pending.') as Error & { status: number }
    err.status = 409
    throw err
  }

  const result = await pool.query(
    `INSERT INTO connection_requests (from_user_id, to_user_id, message)
     VALUES ($1, $2, $3) RETURNING *`,
    [fromId, toId, message],
  )
  const request = result.rows[0]

  await sendNotification(toId, 'CONNECTION_REQUEST', {
    requestId: request.id,
    fromUserId: fromId,
    message,
  }).catch(() => {/* non-fatal */})

  return request
}

export async function respondToConnectionRequest(
  requestId: string,
  userId: string,
  accept: boolean,
) {
  const result = await pool.query(
    `UPDATE connection_requests
     SET status = $1, updated_at = NOW()
     WHERE id = $2 AND to_user_id = $3 AND status = 'PENDING'
     RETURNING *`,
    [accept ? 'ACCEPTED' : 'DECLINED', requestId, userId],
  )
  if (result.rows.length === 0) {
    const err = new Error('Connection request not found.') as Error & { status: number }
    err.status = 404
    throw err
  }

  const req = result.rows[0]
  if (accept) {
    await sendNotification(req.from_user_id, 'CONNECTION_ACCEPTED', {
      requestId,
      fromUserId: userId,
    }).catch(() => {/* non-fatal */})
  }

  return req
}

export async function getPendingRequests(userId: string) {
  const result = await pool.query(
    `SELECT cr.*, p.display_name, p.avatar_url, p.skills
     FROM connection_requests cr
     JOIN profiles p ON p.user_id = cr.from_user_id
     WHERE cr.to_user_id = $1 AND cr.status = 'PENDING'
     ORDER BY cr.created_at DESC`,
    [userId],
  )
  return result.rows
}
