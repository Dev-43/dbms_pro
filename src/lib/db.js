import { Pool } from 'pg';

let pool;

if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}
pool = global._pgPool;

export { pool };

export async function query(text, params) {
  return pool.query(text, params);
}

