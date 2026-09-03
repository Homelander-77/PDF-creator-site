import { createHash, randomBytes } from 'node:crypto';
import { query } from './db.js';

export type TokenPurpose = 'verify' | 'reset';

const hashToken = (raw: string) => createHash('sha256').update(raw, 'utf8').digest('hex');

export async function issueToken(userId: string, purpose: TokenPurpose, ttlSeconds: number): Promise<string> {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
        throw new Error(`ussieToken: incorrect ttlSeconds = ${ttlSeconds}`);
    }
    await query(
        `update email_tokens set used_at = now()
         where user_id = $1 and purpose = $2 and used_at is null`,
        [userId, purpose],
    );

    const raw = randomBytes(32).toString('base64url');

    await query(
        `insert into email_tokens (user_id, purpose, token_hash, expires_at)
         values ($1, $2, $3, now() + make_interval(secs => $4))`,
        [userId, purpose, hashToken(raw), ttlSeconds],
    );
    return raw;
}

export async function consumeToken(raw: string, purpose: TokenPurpose): Promise<string | null> {
    const { rows } = await query<{ user_id: string }>(
        `update email_tokens set used_at = now()
         where token_hash = $1
         and purpose = $2
         and used_at is null
         and expires_at > now()
         returning user_id`,
        [hashToken(raw), purpose],
    );
    return rows.length > 0 ? rows[0].user_id : null;
}
