import type { FastifyInstance } from 'fastify';
import { authenticate, requireSession } from '../auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { currentPeriod } from '../plans.js';
import { getUsage } from '../quota.js';
import { conf } from '../config.js';
import { PLANS } from '../plans.js'

const PAID = new Set(['premium', 'business']);
const METHODS = new Set(['card', 'sbp', 'invoice']);


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

    app.post('/account/checkout', { onRequest: requireSession }, async (req, reply) => {
        const { rows } = await query<{ plan: string; email_verified_at: string | null; current_period_end: Date | null }>(
            `select plan, email_verified_at, current_period_end from users where id = $1`,
            [req.session!.userId],
        )
        if (rows.length === 0) {
            reply.code(401).send({ error: 'not_authenticated' }); return;
        }
        const user = rows[0]
        if (user.email_verified_at === null) {
            reply.code(403).send({ error: 'email_not_verified', message: 'Подтвердите почту перед оплатой.' });
            return;
        }

        const body = (req.body ?? {}) as { plan?: unknown; method?: unknown };
        if (typeof body.plan !== 'string' || !PAID.has(body.plan)) {
            reply.code(400).send({ error: "unknown_plan" }); return;
        }
        if (typeof body.method !== 'string' || !METHODS.has(body.method)) {
            reply.code(400).send({ error: "unknown_method" }); return;
        }
        const plan = body.plan as keyof typeof PLANS;
        if (user.plan === plan && user.current_period_end && user.current_period_end > new Date()) {
            reply.code(409).send({
                error: 'already_on_plan',
                message: `Тариф уже оплачен до ${user.current_period_end.toLocaleDateString('ru')}.`,
            });
            return;
        }

        const { rows: [order] } = await query<{ id: string }>(
            `insert into orders (user_id, plan, amount, method)
             values ($1, $2, $3, $4) returning id`,
            [req.session!.userId, body.plan, PLANS[body.plan].price, body.method],
        );
        // Payment placeholder
        if (body.method === 'invoice') {
            reply.send({
                invoice_id: order.id,
                invoice_url: `${conf.appUrl}/invoice/${order.id}`,
            });
            return;
        }
        reply.send({ payment_url: `${conf.appUrl}/checkout/mock?order=${order.id}` });
    });
}
