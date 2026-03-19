import pool from '../../db/client';

export async function listHackathons() {
  const result = await pool.query('SELECT * FROM hackathons ORDER BY start_date ASC');
  return result.rows;
}

export async function getHackathon(id: string) {
  const result = await pool.query('SELECT * FROM hackathons WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createHackathon(data: any) {
  const { title, description, start_date, end_date, theme } = data;
  const result = await pool.query(
    `INSERT INTO hackathons (title, description, start_date, end_date, theme)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, description, start_date, end_date, theme]
  );
  return result.rows[0];
}
