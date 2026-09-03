import { createKey } from '../src/key.js';
import { query, pool } from '../src/db.js';
import { redis } from '../src/redis.js';

const { rows } = await query<{ id: string }>(
    `INSERT INTO users (email) VALUES ($1)
   ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
   RETURNING id`,
    ['me@test.dev'],
);

const key = await createKey(rows[0].id);
console.log(key.raw);

await pool.end();
redis.disconnect();
