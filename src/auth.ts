import type { FastifyReply, FastifyRequest } from 'fastify';
import { fastifyCookie } from '@fastify/cookie';
import { resolveKey, type Identity } from './key.js';
import { getPlan, type Plan } from './plans.js';
import { checkRate } from './quota.js'
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
    const alt = req.headers['z-api-key'];
    if (typeof alt === 'string' && alt.length > 0) return alt.trim();
    return null;
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const key = await extractKey(req);
    if (!key) return reply.code(401).send({ error: 'missing_api_key' });
    const identity = await resolveKey(key);
    if (!identity) return reply.code(401).send({ error: 'invalid_api_key' });
    const plan = getPlan(identity.plan);
    const rate = await checkRate(identity.keyId, plan);
    console.log('rate:', rate);
    if (!rate.allowed) {
        return reply.code(429).send({ error: 'not_allowed', retry_after_ms: rate.retryAfterMs });
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
