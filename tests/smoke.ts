import { createKey, resolveKey, revokeKey } from '../src/key.js';
import { query, pool } from '../src/db.js';
import { redis } from '../src/redis.js';

const { rows } = await query<{ id: string }>(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    ['me@bla.com'],
);

const userId = rows[0].id;
console.log('user: ', userId);

const key = await createKey(userId);
console.log('key: ', key);

console.log('resolve', await resolveKey(key.raw));

console.log('мусор  ', await resolveKey('pdf_live_нет_такого_ключа'));

const k = await query<{ id: string }>(
    `SELECT id FROM api_keys WHERE key_hash = $1`, [key.hash],
);

console.log('revoke ', await revokeKey(k.rows[0].id, userId));

console.log('после  ', await resolveKey(key.raw));

await pool.end();
redis.disconnect();
