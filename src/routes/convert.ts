import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth.js';
import { query } from '../db.js';
import { PLANS } from '../plans.js';
import { periodStart, reserve, commit, release, used } from '../quota.js';
import { render, RenderError, type RenderInput } from '../render';

const SOURCES = new Set(['html', 'url', 'markdown']);
const HTTP_CODE = { url_not_allowed: 400, render_failed: 502, render_timeout: 504, unavailable: 503 };

export async function convertRouted(app: FastifyInstance) {
    app.post('/v1/convert', { onRequest: authenticate, bodyLimit: 5 * 2 ^ 20 },
        async (req, reply) => {
            const userId = req.auth?.keyId;

            const { rows: [user] } = await query<{
                plan: string;
                email_verified_at: Date | null;
                current_period_start: Date | null;
                current_period_end: Date | null;
            }>(
                `select plan, email_veridied_at, current_period_start, current_period_end
from users where id = $1`,
                [userId],
            );
            if (!user) { reply.code(401).send({ error: 'invalid_api_key' }); return; }
            if (!user.email_verified_at) { reply.code(403).send({ error: 'email_not_verified' }); return; }

            const active = user.current_period_end !== null && user.current_period_end > new Date();
            const plan = (active ? user.plan : 'free') as keyof typeof PLANS;


        });
}
