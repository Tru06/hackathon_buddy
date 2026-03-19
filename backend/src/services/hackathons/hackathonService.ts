import pool from '../../db/client'

export async function listHackathons(filters?: { theme?: string; location?: string }) {
  const conditions: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (filters?.theme) {
    conditions.push(`theme ILIKE $${idx}`)
    params.push(`%${filters.theme}%`)
    idx++
  }
  if (filters?.location) {
    conditions.push(`location ILIKE $${idx}`)
    params.push(`%${filters.location}%`)
    idx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await pool.query(
    `SELECT * FROM hackathons ${where} ORDER BY start_date ASC`,
    params,
  )
  return result.rows
}

export async function getHackathon(id: string) {
  const result = await pool.query('SELECT * FROM hackathons WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function createHackathon(data: any) {
  const { title, description, start_date, end_date, theme, location, max_team_size, registration_url } = data
  const result = await pool.query(
    `INSERT INTO hackathons (title, description, start_date, end_date, theme, location, max_team_size, registration_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [title, description, start_date, end_date, theme, location ?? 'Online', max_team_size ?? 4, registration_url],
  )
  return result.rows[0]
}

export async function registerInterest(userId: string, hackathonId: string) {
  await pool.query(
    `INSERT INTO hackathon_interests (hackathon_id, user_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [hackathonId, userId],
  )
}

export async function removeInterest(userId: string, hackathonId: string) {
  await pool.query(
    'DELETE FROM hackathon_interests WHERE hackathon_id = $1 AND user_id = $2',
    [hackathonId, userId],
  )
}

export async function getParticipants(hackathonId: string) {
  const result = await pool.query(
    `SELECT p.* FROM profiles p
     JOIN hackathon_interests hi ON hi.user_id = p.user_id
     WHERE hi.hackathon_id = $1
     ORDER BY p.display_name ASC`,
    [hackathonId],
  )
  return result.rows
}
