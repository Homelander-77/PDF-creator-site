import { redis } from './redis.js';

const TTL_EXP = 30 * 24 * 3600
export type Period = {
    current_period_start: Date | null;
    current_period_end: Date | null;
};

export function periodStart(u: Period): Date {
    const now = new Date();
    if (u.current_period_start && u.current_period_end && u.current_period_end > now) {
        return u.current_period_start;
    }
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function key(userId: string, start: Date): string {
    return `quota:${userId}:${start.toISOString().slice(0, 10)}`;
}

const REVERSE_LUA = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])

if used + 1 > limit then
  return -1
end

local now = redis.call('INCR', KEYS[1])
if now == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[2])
end


return limit - used
`;

export async function reverce(userId: string, start: Date, limit: number): Promise<number> {
    const r = Number(await redis.eval(REVERSE_LUA, 1, key(userId, start), limit, TTL_EXP));
    return r === -1 ? 0 : r;
}

const COMMIT_LUA = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local extra = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])

if used + extra > limit then
  redis.call('DECRBY', KEYS[1], 1)
  return -1
end

return redis.call('INCRBY', KEYS[1], extra)
`;

export async function commit(userId: string, start: Date, pages: number, limit: number): Promise<boolean> {
    const r = Number(await redis.eval(COMMIT_LUA, 1, key(userId, start), pages - 1, limit));
    return r !== -1;
}

export async function release(userId: string, start: Date): Promise<void> {
    await redis.decrby(key(userId, start), 1);
}

export async function used(userId: string, start: Date): Promise<number> {
    return Number((await redis.get(key(userId, start))) ?? 0);
}
