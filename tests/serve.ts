// tests/serve.ts
import Fastify from 'fastify';
import cookie from '@fastify/cookie';

import { conf } from '../src/config.js';
import { pool } from '../src/db.js';
import { redis } from '../src/redis.js';

import { accountRoutes } from '../src/routes/account.js';
import { authRoutes } from '../src/routes/auth.js';
import { sessionRoutes } from '../src/routes/session.js';
import { accountSessionRoutes } from '../src/routes/account-session.js';

const app = Fastify({
    logger: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } },
    },
    trustProxy: process.env.TRUST_PROXY === 'true',
});

await app.register(cookie);

app.get('/health', async () => {
    const [db, cache] = await Promise.allSettled([
        pool.query('SELECT 1'),
        redis.ping(),
    ]);
    return {
        status: db.status === 'fulfilled' && cache.status === 'fulfilled' ? 'ok' : 'degraded',
        postgres: db.status === 'fulfilled',
        redis: cache.status === 'fulfilled',
    };
});

await app.register(accountRoutes);   // /v1/*      — по API-ключу
await app.register(authRoutes);      // /auth/register, /auth/verify, /auth/resend
await app.register(sessionRoutes);   // /auth/login, /auth/logout, /auth/session
await app.register(accountSessionRoutes)

await app.listen({ port: conf.port, host: '0.0.0.0' });

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
    process.on(sig, async () => {
        await app.close();
        await pool.end();
        redis.disconnect();
        process.exit(0);
    });
}
