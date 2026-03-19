import { Pool } from 'pg';

// Configured PostgreSQL connection pool.
// Reads from DATABASE_URL if set, otherwise falls back to individual PG_* env vars.
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host: process.env.PGHOST ?? 'localhost',
        port: Number(process.env.PGPORT ?? 5432),
        database: process.env.PGDATABASE ?? 'hackathon_buddy',
        user: process.env.PGUSER ?? 'postgres',
        password: process.env.PGPASSWORD ?? '',
      }
);

export default pool;
