import { redis } from './redis.js';

const HIT_LUA = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return n
`;

declare module 'ioredis' {
    interface RedisCommander<Context> {
        rlHint(key: string, ttl: string): Promise<number>;
    }
}

redis.defineCommand('rlHit', { numberOfKeys: 1, lua: HIT_LUA });

export interface RateResult {
    allowed: boolean;
    retryAfterSec: number;
}

export async function hit(key: string, limit: number, windowSec: number): Promise<RateResult> {
    try {
        const n = await redis.rlHint(key, String(windowSec));
        if (n <= limit) return { allowed: true, retryAfterSec: 0 };
        const ttl = await redis.ttl(key);
        return { allowed: false, retryAfterSec: ttl > 0 ? ttl : windowSec };
    } catch {
        return { allowed: true, retryAfterSec: 0 };
    }
}

export async function reset(key: string): Promise<void> {
    await redis.del(key).catch(() => { });
}
