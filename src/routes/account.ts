import type { FastifyInstance } from 'fastify';
import { authenticate, requireSession } from '../auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { used, periodStart } from '../quota.js';
import { conf } from '../config.js';
import { PLANS, getPlan } from '../plans.js'

const PAID = new Set(['premium', 'business']);
const METHODS = new Set(['card', 'sbp', 'invoice']);


export async function accountRoutes(app: FastifyInstance): Promise<void> {
    app.get('/v1/me', { onRequest: authenticate }, async (req, reply) => {
        const userId = req.auth!.userId;
        const { rows: [user] } = await query<{
            plan: string;
            current_period_start: Date | null;
            current_period_end: Date | null;
        }>(
            `select plan, current_period_start, current_period_end from users where id = $1`,
            [userId],
        );
        if (!user) return reply.code(401).send({ error: 'invalid_api_key' });
        const active = user.current_period_end !== null && user.current_period_end > new Date();
        const plan = getPlan(active ? user.plan : 'free');
        const start = periodStart(user);
        const spent = await used(userId, start);

        return {
            user_id: userId,
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
    })

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
