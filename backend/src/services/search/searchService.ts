import pool from '../../db/client'
import redis from '../../db/redis'

const CACHE_TTL = 60 // seconds

export interface SearchFilters {
  skills?: string[]
  interests?: string[]
  availability?: string
  hackathonId?: string
  excludeTeamed?: boolean
  timezone?: string
}

export interface ScoredProfile {
  user_id: string
  display_name: string
  bio: string
  skills: string[]
  interests: string[]
  availability: string
  timezone: string
  avatar_url: string
  github_url: string
  linkedin_url: string
  portfolio_url: string
  score: number
}

/** Compute a [0,1] match score between two profiles based on skill/interest/availability overlap. */
function computeMatchScore(
  currentSkills: string[],
  currentInterests: string[],
  currentAvailability: string,
  candidate: ScoredProfile,
  filterSkills: string[],
): number {
  const weights = { skills: 0.5, interests: 0.3, availability: 0.2 }

  const targetSkills = filterSkills.length > 0 ? filterSkills : currentSkills
  const sharedSkills = candidate.skills.filter(s => targetSkills.includes(s))
  const skillScore = sharedSkills.length / Math.max(targetSkills.length, 1)

  const sharedInterests = candidate.interests.filter(i => currentInterests.includes(i))
  const interestScore = sharedInterests.length / Math.max(currentInterests.length, 1)

  let availScore = 0
  if (candidate.availability === currentAvailability) {
    availScore = 1
  } else if (
    (currentAvailability === 'FULL_TIME' && candidate.availability === 'PART_TIME') ||
    (currentAvailability === 'PART_TIME' && candidate.availability === 'WEEKENDS')
  ) {
    availScore = 0.5
  }

  const score = skillScore * weights.skills + interestScore * weights.interests + availScore * weights.availability
  return Math.min(Math.max(score, 0), 1)
}

/** Compute a complementarity score — rewards unique skills the candidate brings. */
function computeComplementScore(currentSkills: string[], candidate: ScoredProfile): number {
  const uniqueSkills = candidate.skills.filter(s => !currentSkills.includes(s))
  const overlapSkills = candidate.skills.filter(s => currentSkills.includes(s))
  const uniquenessScore = uniqueSkills.length / Math.max(candidate.skills.length, 1)
  const synergyScore = overlapSkills.length / Math.max(currentSkills.length + candidate.skills.length, 1)
  return uniquenessScore * 0.7 + synergyScore * 0.3
}

/**
 * Search users by skills, interests, availability, and hackathon scope.
 * Results are scored by match quality and cached in Redis for 60s.
 */
export async function searchUsers(
  requestingUserId: string,
  filters: SearchFilters,
  page = 1,
  pageSize = 20,
): Promise<{ items: ScoredProfile[]; total: number }> {
  const cacheKey = `search:${requestingUserId}:${JSON.stringify(filters)}:${page}:${pageSize}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {
    // Cache miss — proceed without cache
  }

  const conditions: string[] = ['p.user_id != $1']
  const params: unknown[] = [requestingUserId]
  let idx = 2

  if (filters.skills && filters.skills.length > 0) {
    conditions.push('p.skills && $' + idx + '::text[]')
    params.push(filters.skills)
    idx++
  }

  if (filters.interests && filters.interests.length > 0) {
    conditions.push('p.interests && $' + idx + '::text[]')
    params.push(filters.interests)
    idx++
  }

  if (filters.availability) {
    conditions.push('p.availability = $' + idx)
    params.push(filters.availability)
    idx++
  }

  if (filters.timezone) {
    conditions.push('p.timezone = $' + idx)
    params.push(filters.timezone)
    idx++
  }

  if (filters.hackathonId) {
    conditions.push(
      'EXISTS (SELECT 1 FROM hackathon_interests hi WHERE hi.user_id = p.user_id AND hi.hackathon_id = $' + idx + ')',
    )
    params.push(filters.hackathonId)
    idx++
  }

  if (filters.excludeTeamed && filters.hackathonId) {
    conditions.push(
      'NOT EXISTS (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE tm.user_id = p.user_id AND t.hackathon_id = $' + idx + ')',
    )
    params.push(filters.hackathonId)
    idx++
  }

  const where = conditions.join(' AND ')

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM profiles p WHERE ' + where,
    params,
  )
  const total = parseInt(countResult.rows[0].count, 10)

  const offset = (page - 1) * pageSize
  const result = await pool.query<ScoredProfile>(
    'SELECT p.user_id, p.display_name, p.bio, p.skills, p.interests, ' +
    'p.availability, p.timezone, p.avatar_url, p.github_url, p.linkedin_url, p.portfolio_url ' +
    'FROM profiles p WHERE ' + where + ' ORDER BY p.updated_at DESC ' +
    'LIMIT $' + idx + ' OFFSET $' + (idx + 1),
    [...params, pageSize, offset],
  )

  // Fetch requesting user's profile for scoring
  const selfResult = await pool.query(
    'SELECT skills, interests, availability FROM profiles WHERE user_id = $1',
    [requestingUserId],
  )
  const self = selfResult.rows[0] ?? { skills: [], interests: [], availability: 'FULL_TIME' }

  const items: ScoredProfile[] = result.rows.map(candidate => ({
    ...candidate,
    score: computeMatchScore(
      self.skills,
      self.interests,
      self.availability,
      candidate,
      filters.skills ?? [],
    ),
  }))

  items.sort((a, b) => b.score - a.score)

  const response = { items, total }

  try {
    await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL)
  } catch {
    // Non-fatal
  }

  return response
}

/**
 * Return top-20 suggested teammates for a user in a hackathon,
 * ranked by complementarity (fills skill gaps).
 */
export async function getSuggestedTeammates(
  userId: string,
  hackathonId: string,
): Promise<ScoredProfile[]> {
  const selfResult = await pool.query(
    'SELECT skills, interests, availability FROM profiles WHERE user_id = $1',
    [userId],
  )
  const self = selfResult.rows[0] ?? { skills: [], interests: [], availability: 'FULL_TIME' }

  const result = await pool.query<ScoredProfile>(
    `SELECT p.user_id, p.display_name, p.bio, p.skills, p.interests,
            p.availability, p.timezone, p.avatar_url, p.github_url,
            p.linkedin_url, p.portfolio_url
     FROM profiles p
     JOIN hackathon_interests hi ON hi.user_id = p.user_id
     WHERE hi.hackathon_id = $1
       AND p.user_id != $2
       AND NOT EXISTS (
         SELECT 1 FROM connection_requests cr
         WHERE (cr.from_user_id = $2 AND cr.to_user_id = p.user_id)
            OR (cr.from_user_id = p.user_id AND cr.to_user_id = $2)
       )
       AND NOT EXISTS (
         SELECT 1 FROM team_members tm
         JOIN teams t ON tm.team_id = t.id
         WHERE tm.user_id = p.user_id AND t.hackathon_id = $1
       )`,
    [hackathonId, userId],
  )

  const scored = result.rows.map(candidate => ({
    ...candidate,
    score: computeComplementScore(self.skills, candidate),
  }))

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 20)
}

/**
 * Get a pairwise match score between two users.
 */
export async function getMatchScore(userAId: string, userBId: string): Promise<number> {
  const result = await pool.query(
    'SELECT skills, interests, availability FROM profiles WHERE user_id = ANY($1)',
    [[userAId, userBId]],
  )
  if (result.rows.length < 2) return 0

  const [a, b] = result.rows[0].user_id === userAId ? result.rows : [result.rows[1], result.rows[0]]
  return computeMatchScore(a.skills, a.interests, a.availability, b, [])
}
