import { createHash, randomBytes } from 'crypto';
import { redis } from './redis.js';
import { conf } from './config.js';

const sessionKey = (sid: string) => `sess:${createHash('sha256').update(sid).digest('hex')}`;
const sidHash = (sid: string) => createHash('sha256').update(sid).digest('hex');
const userSetKey = (userId: string) => `user-session:${userId}`;

export async function createSession(userId: string): Promise<string> {
    const sid = randomBytes(32).toString('base64url');
    await redis.set(sessionKey(sid), JSON.stringify({ userId }), 'EX', conf.sessionTtl).catch(() => { });
    await destroyAllSessions(userId);
    await redis.sadd(userSetKey(userId), sidHash(sid));
    await redis.expire(userSetKey(userId), conf.sessionTtl);
    return sid;
}

export async function getSession(sid: string): Promise<{ userId: string } | null> {
    const key = sessionKey(sid)
    let raw: string | null = null;
    try {
        raw = await redis.get(key);
    } catch {
        return null;
    }
    if (!raw) return null;
    await redis.expire(key, conf.sessionTtl).catch(() => { })
    return JSON.parse(raw) as { userId: string };
}

export async function destroySession(sid: string): Promise<void> {
    const session = await getSession(sid);
    await redis.del(sessionKey(sid)).catch(() => { })
    if (session) {
        await redis.srem(userSetKey(session.userId), sidHash(sid)).catch(() => { });
    }
}


export async function destroyAllSessions(userId: string) {
    const key = userSetKey(userId);
    const hashes = await redis.smembers(key);
    if (hashes.length > 0) {
        await redis.del(...hashes.map((h) => `sess:${sessionKey(h)}`));
    }
    await redis.del(key);
}
