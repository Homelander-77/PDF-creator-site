import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { currentPeriod } from '../plans.js';
import { getUsage } from '../quota.js';


export async function accountRoutes(app: FastifyInstance): Promise<void> {
    app.get('/v1/me', { onRequest: authenticate }, async (req) => {
        const auth = req.auth!;
        const plan = auth.planConfig;
        const usage = await getUsage(auth.userId, plan);
        return {
            user_id: auth.userId,
            plan: plan.id,
            period: currentPeriod(),
            usage: {
                pages_used: usage.used,
                pages_limit: usage.limit,
                pages_remaining: usage.remaining,
            },
            limits: {
                requests_per_second: plan.ratePerSecond,
                burst: plan.burst,
            },
        };
    })

    app.get('/v1/keys', { onRequest: authenticate }, async (req) => {
        const { rows } = await query(
            `SELECT id, name, key_prefix, last_used_at, created_at
             FROM api_keys
             WHERE user_id = $1 AND revoked_at IS NULL
             ORDER BY created_at`,
            [req.auth!.userId],
        );
        return { keys: rows };
    });

    app.post('/v1/keys', { onRequest: authenticate }, async (req, reply) => {
        if (!req.auth!.emailVerified) {
            return reply.code(403).send({
                error: 'email_not_verified',
                message: 'Confirm your email address to realise keys.',
            });
        }
        const body = (req.body ?? {}) as { name?: unknown };
        const name = typeof body.name === 'string' && body.name.trim().length > 0
            ? body.name.trim().slice(0, 64) : 'default';
        const key = await createKey(req.auth!.userId, name);
        return reply.code(201).send({
            id: key.id,
            name,
            prefix: key.prefix,
            api_key: key.raw,
            warning: 'Save your key, otherwise restore it impossible.'
        });
    });

    app.delete('/v1/keys/:id', { onRequest: authenticate }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const ok = await revokeKey(id, req.auth!.userId);
        if (!ok) return reply.code(404).send({ error: 'key_not_found' });
        return reply.code(204).send();
    });
}
