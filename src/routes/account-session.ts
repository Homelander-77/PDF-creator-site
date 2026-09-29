import type { FastifyInstance } from 'fastify';
import { requireSession } from '../auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { getPlan } from '../plans.js';
import { used, periodStart } from '../quota.js';


export async function accountSessionRoutes(app: FastifyInstance): Promise<void> {
    app.get('/account/me', { onRequest: requireSession }, async (req, reply) => {
        const { rows: [user] } = await query<{
            plan: string;
            current_period_start: Date | null;
            current_period_end: Date | null;
        }>(
            `select plan, current_period_start, current_period_end from users where id = $1`,
            [req.session!.userId],
        );
        if (!user) return reply.code(401).send({ error: 'not_authenticated' });

        const active = user.current_period_end !== null && user.current_period_end > new Date();
        const plan = getPlan(active ? user.plan : 'free');

        const start = periodStart(user)
        const spent = await used(req.session!.userId, start);

        return {
            user_id: req.session!.userId,
            plan: plan.id,
            period: start.toISOString().slice(0, 10),
            usage: {
                pages_used: spent,
                pages_limit: plan.pagesPerMonth,
                pages_remaining: Math.max(0, plan.pagesPerMonth - spent),
            },
            limits: {
                requests_per_second: plan.ratePerSecond,
                burst: plan.burst,
            },
        };
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


