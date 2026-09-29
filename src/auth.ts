import type { FastifyReply, FastifyRequest } from 'fastify';
import { fastifyCookie } from '@fastify/cookie';
import { resolveKey, type Identity } from './key.js';
import { getPlan, type Plan } from './plans.js';
import { hit } from './ratelimits.js'
import { conf } from './config.js';
import { getSession } from './session.js';


declare module 'fastify' {
    interface FastifyRequest {
        auth?: Identity & { planConfig: Plan };
        session?: { userId: string };

    }
}

function extractKey(req: FastifyRequest): string | null {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7).trim();
    const alt = req.headers['x-api-key'];
    if (typeof alt === 'string' && alt.length > 0) return alt.trim();
    return null;
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const key = extractKey(req);
    if (!key) {
        reply.code(401).send({ error: 'missing_api_key' });
        return;
    }
    const identity = await resolveKey(key);
    if (!identity) {
        reply.code(401).send({ error: 'invalid_api_key' });
        return;
    }
    const plan = getPlan(identity.plan);
    const windowSec = Math.ceil(plan.burst / plan.ratePerSecond);
    const rate = await hit(`rl:${identity.keyId}`, plan.burst, windowSec);
    if (!rate.allowed) {
        reply.header('Retry-After', rate.retryAfterSec);
        reply.code(429).send({ error: 'rate_limit_exceeded', retry_after_sec: rate.retryAfterSec });
        return;
    }
    req.auth = {
        ...identity, planConfig: plan
    };
}

export async function requireSession(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const sid = req.cookies[conf.cookieName];
    if (!sid) {
        reply.code(401).send({ error: 'not_authenticated' });
        return;
    }
    const session = await getSession(sid);
    if (!session) {
        reply.clearCookie(conf.cookieName);
        reply.code(401).send({ error: 'not_authenticated' });
        return;
    }
    req.session = { userId: session.userId }
}
