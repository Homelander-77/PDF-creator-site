import type { FastifyInstance } from 'fastify';
import { authenticate } from '../auth.js';
import { query } from '../db.js';
import { PLANS } from '../plans.js';
import { periodStart, reserve, commit, release, used } from '../quota.js';
import { type PageOptions, type RenderResult, type RenderInput, RenderError, render } from '../render/index.js';

const SOURCES = new Set(['html', 'url', 'markdown']);
const HTTP_CODE = { url_not_allowed: 400, render_failed: 502, render_timeout: 504, unavailable: 503 };
const OPTION_KEYS = new Set([
    'landscape',
    'paperWidth',
    'paperHeight',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    'waitDelay',
]);


export async function convertRoutes(app: FastifyInstance) {
    app.post('/v1/convert', { onRequest: authenticate, bodyLimit: 5 * 1024 * 1024 },
        async (req, reply) => {
            const userId = req.auth!.userId;
            const { rows: [user] } = await query<{
                plan: string;
                email_verified_at: Date | null;
                current_period_start: Date | null;
                current_period_end: Date | null;
            }>(
                `select plan, email_verified_at, current_period_start, current_period_end
from users where id = $1`,
                [userId],
            );
            if (!user) { reply.code(401).send({ error: 'invalid_api_key' }); return; }
            if (!user.email_verified_at) { reply.code(403).send({ error: 'email_not_verified' }); return; }

            const body = (req.body ?? {}) as Record<string, unknown>;
            const source = body.source;
            if (typeof source !== 'string' || !SOURCES.has(source)) {
                return reply.code(400).send({ error: 'invalid_request', message: 'source: html, url of markdown' });
            }
            const options = body.options;
            if (typeof options === 'object' && options !== null && !Array.isArray(options)) {
                for (const [k, v] of Object.entries(options)) {
                    if (!OPTION_KEYS.has(k as keyof PageOptions)) return reply.code(400).send({ error: 'invalid_option' });
                    const okType = k === 'landscape' ? typeof v === 'boolean' : typeof v === 'string';
                    if (!okType) return reply.code(400).send({ error: 'invalid_option' });
                }
            } else if (options !== undefined) {
                return reply.code(400).send({ error: 'invalid_request' });
            }

            const content = body[source];
            if (typeof content !== 'string' || content.trim() === '') {
                return reply.code(400).send({ error: 'invalid_request', message: 'Empty data' });
            }

            const active = user.current_period_end !== null && user.current_period_end > new Date();
            const plan = (active ? user.plan : 'free') as keyof typeof PLANS;
            const start = periodStart(user);
            if (plan === 'free' && source !== 'html') {
                return reply.code(401).send({ error: 'not_allowed' });
            }
            const limit = PLANS[plan].pagesPerMonth;
            const allowed = await reserve(userId, start, limit);
            if (allowed === 0) {
                return reply.code(402).send({ error: 'quota_exceeded', message: 'Pages have been spent' });
            }
            let result: RenderResult;
            try {
                result = await render({
                    maxPages: allowed + 1, options: body.options, [source]: content, html: content
                } as RenderInput);
            } catch (e) {
                await release(userId, start);
                if (e instanceof RenderError) {
                    return reply.code(HTTP_CODE[e.code]).send({ error: e.code });
                }
                throw e;
            }
            const ok = await commit(userId, start, result.pages, limit);
            if (!ok) {
                return reply.code(402).send({ error: 'quota_exceeded' });
            }
            const spent = await used(userId, start);
            return reply.code(200).headers({
                'Content-Type': 'application/pdf',
                'X-Pages-Rendered': result.pages,
                'X-Quota-Limit': limit,
                'X-Quota-Used': spent,
                'X-Quota-Remaining': Math.max(0, limit - spent)
            }).send(result.pdf)
        });
}
