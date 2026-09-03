import { createHash, randomBytes } from 'node:crypto';
import { conf } from './config.js'
import { query } from './db.js'
import { redis } from './redis.js'

interface NewKey {
    raw: string;
    hash: string;
    prefix: string;
}

export interface Identity {
    keyId: string;
    userId: string;
    plan: string;
    emailVerified: boolean;
}

export function generateKey(): NewKey {
    const raw = conf.keyPrefix + randomBytes(32).toString('base64url');
    const hash = createHash('sha256').update(raw).digest('hex');
    return { raw, hash, prefix: raw.slice(0, 15) };
}

export async function createKey(userId: string, name = 'default'
): Promise<{ raw: string; id: string; prefix: string }> {
    const key = generateKey();
    const { rows } = await query<{ id: string }>(
        `INSERT INTO api_keys (user_id, name, key_hash, key_prefix)
     VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, name, key.hash, key.prefix],
    );
    return { raw: key.raw, id: rows[0].id, prefix: key.prefix };
}

export async function resolveKey(rawKey: string): Promise<Identity | null> {
    if (!rawKey.startsWith(conf.keyPrefix)) return null;
    const hash = createHash('sha256').update(rawKey).digest('hex');
    let cached: string | null = null;
    try {
        cached = await redis.get(`authkey:${hash}`);
    } catch {

    }
    if (cached == 'miss') return null;
    if (cached) return JSON.parse(cached) as Identity;

    const { rows } = await query<{
        id: string, user_id: string, plan: string, email_verified_at: string | null
    }>(
        `SELECT k.id, k.user_id, u.plan, k.email_verified_at
         FROM api_keys k
         JOIN users u ON u.id = k.user_id
         WHERE k.key_hash = $1 AND k.revoked_at IS NULL`,
        [hash],
    );
    if (rows.length === 0) {
        await redis.set(`authkey:${hash}`, 'miss', 'EX', 30);
        return null;
    }
    const identity: Identity = {
        keyId: rows[0].id,
        userId: rows[0].user_id,
        plan: rows[0].plan,
        emailVerified: rows[0].email_verified_at !== null,
    };
    await redis.set(`authkey:${hash}`, JSON.stringify(identity), 'EX', 60).catch(() => { });
    return identity;
}

export async function revokeKey(keyId: Identity["keyId"], userId: Identity["userId"]): Promise<boolean> {
    const { rows } = await query<{ key_hash: string }>(
        `update api_keys set revoked_at = now()
         where id = $1 and user_id = $2 and revoked_at is NULL
         returning key_hash`,
        [keyId, userId]
    );
    if (rows.length === 0) return false;
    await redis.del(`authkey:${rows[0].key_hash}`).catch(() => { });
    return true;
}
