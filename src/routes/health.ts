import type { FastifyInstance } from 'fastify';
import { pool } from '../db.js';
import { redis } from '../redis.js';

type GotenbergHealth = {
    status: string,
    details: {
        chromium: {
            status: string
            timestamp: string,
        },
        libreoffice: {
            status: string,
            timestamp: string,
        },
    },
};

export async function serviceStatus(app: FastifyInstance) {
    app.get('/health', async (req, reply) => {
        const gotenbergUrl = process.env.GOTENDERG_URL ?? 'http://localhost:3100';

        const [db, cache, render] = await Promise.allSettled([
            pool.query('SELECT 1'),
            redis.ping(),
            fetch(`${gotenbergUrl}/health`, { signal: AbortSignal.timeout(2000) })
                .then((r) => r.json() as Promise<GotenbergHealth>),
        ]);
        const postgresOk = db.status === 'fulfilled';
        const redisOk = cache.status === 'fulfilled';
        const renderOk = render.status === 'fulfilled' && render.value.status === 'up';
        const ok = postgresOk && redisOk && renderOk;
        return reply.code(ok ? 200 : 503).send({
            status: ok ? 'ok' : 'degraded',
            postgresOk,
            redisOk,
            renderOk,
        });
    });
}
