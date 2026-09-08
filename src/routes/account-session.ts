import type { FastifyInstance } from 'fastify';
import { requireSession } from '../auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { getPlan, currentPeriod } from '../plans.js';
import { getUsage } from '../quota.js';
import { create } from 'domain';


export async function accountSessionRoutes(app: FastifyInstance): Promise<void> {
    app.get('/account/me', { onRequest: requireSession }, async (req, reply) => {
        const { rows } = await query<{ plan: string }>(
            `select plan from users where id = $1`,
            [req.session!.userId],
        );
        if (rows.length === 0) return reply.code(401).send({ error: 'not_authenticated' });

        const plan = getPlan(rows[0].plan);
        const usage = await getUsage(req.session!.userId, plan);
        return {
            user_id: req.session!.userId,
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
        }
    });

    app.get('/account/keys', { onRequest: requireSession }, async (req) => {
        const { rows } = await query(
            `select id, name, key_prefix, last_used_at, created_at
             from api_keys
             where user_id = $1 and revoked_at is null
             order by created_at`,
            [req.session!.userId],
        );
        return { keys: rows };
    });

    app.post('/account/keys', { onRequest: requireSession }, async (req, reply) => {
        const { rows } = await query<{ email_verified_at: string | null }>(
            `select email_verified_at from users where id = $1`,
            [req.session!.userId],
        );
        if (rows.length === 0) return reply.code(401).send({ error: 'not_authenticated' });
        if (rows[0].email_verified_at === null) {
            return reply.code(403).send({
                error: 'email_not_verified',
                message: 'Confirm email address to receive keys.'
            });
        }
        const b = (req.body ?? {}) as { name?: unknown };
        const name = typeof b.name === 'string' && b.name.trim().length > 0
            ? b.name.trim().slice(0, 64)
            : 'default';
        const key = await createKey(req.session!.userId, name);
        return reply.code(201).send({
            id: key.id,
            name,
            prefix: key.prefix,
            api_key: key.raw,
            warning: 'Save the key: cannot be shown later.'
        });
    });

    app.delete('/account/keys/:id', { onRequest: requireSession }, async (req, reply) => {
        const { id } = req.params as { id: string };
        const ok = await revokeKey(id, req.session!.userId);
        if (!ok) return reply.code(404).send({ error: 'key_not_found' });
        return reply.code(204).send();
    });
}


