import pool from '../../db/client';

export async function getProfile(userId: string) {
  const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0];
}

export async function upsertProfile(userId: string, profileData: any) {
  const { display_name, bio, skills, experience_level, github_url, linkedin_url } = profileData;

  const result = await pool.query(
    `INSERT INTO profiles (user_id, display_name, bio, skills, experience_level, github_url, linkedin_url, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET 
       display_name = EXCLUDED.display_name,
       bio = EXCLUDED.bio,
       skills = EXCLUDED.skills,
       experience_level = EXCLUDED.experience_level,
       github_url = EXCLUDED.github_url,
       linkedin_url = EXCLUDED.linkedin_url,
       updated_at = NOW()
     RETURNING *`,
    [userId, display_name, bio, skills, experience_level, github_url, linkedin_url]
  );
  return result.rows[0];
}

export async function findMatches(skills: string[]) {
  // A basic matching algorithm matching other users with intersecting skills
  if (!skills || skills.length === 0) return [];

  const result = await pool.query(
    `SELECT user_id, display_name, skills, experience_level
     FROM profiles
     WHERE skills && $1::text[]
     ORDER BY updated_at DESC
     LIMIT 20`,
    [skills]
  );
  return result.rows;
}
