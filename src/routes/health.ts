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
        let res;
        try {
            res = await fetch("http://localhost:3100/health", { method: 'GET' });
        } catch (e) {
            return reply.code(502).send({ error: 'service_unavailable' });
        }

        const body = (await res.json()) as GotenbergHealth;
        if (typeof body.status !== 'string') return reply.code(502);
        const ok = body.status === 'up' ? 200 : 503
        return reply.code(ok).send({ status: ok ? 'ok' : 'degraded', renderee: ok });
        const [db, cache] = await Promise.allSettled([
            pool.query('SELECT 1'),
            redis.ping(),
        ]);
        return {
            status: db.status === 'fulfilled' && cache.status === 'fulfilled' && ok === 200 ? 'ok' : 'degraded',
            postgres: db.status === 'fulfilled',
            redis: cache.status === 'fulfilled',
            gotenberg: ok === 200,
        };

    });
}
