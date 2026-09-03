import type { FastifyInstance } from 'fastify';
import { normalizeEmail } from '../normalizer.js';
import { hit, reset } from '../ratelimits.js';
import { query } from '../db.js';
import { hashPassword, verifyPassword } from '../passwords.js'
import { createSession, destroySession } from '../session.js';
import { conf } from '../config.js';
import { requireSession } from '../auth.js';

const DUMMY_HASH =
    '$argon2id$v=19$m=19456,t=2,p=1$NcWfjWiQxwUBihSxOA/WWw$h0qabKHRIrir/TRe2PqmvvFZWJQmnrS4BDkf1VXKRCc';

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
    app.post('/auth/login', async (req, reply) => {
        const body = (req.body ?? {}) as { email?: string, password?: string };
        const email = normalizeEmail(body.email);
        if (!email || typeof body.password !== 'string' || body.password.length === 0) {
            reply.code(401).send({ error: 'invalid_credentials' });
            return;
        }
        const byEmail = `login:${email}`;
        const byIp = `login-ip:${req.ip}`;

        const [e, i] = await Promise.all([
            hit(byEmail, 5, 60),
            hit(byIp, 20, 60),
        ]);

        if (!e.allowed || !i.allowed) {
            const retry = Math.max(i.retryAfterSec, e.retryAfterSec);
            reply.header('Retry-After', retry);
            reply.code(429).send({ error: 'too_many_attempts', retry_after_sec: retry });
            return;
        }

        const { rows } = await query<{
            id: string; password_hash: string | null; email_verified_at: string | null; plan: string;
        }>(
            `select id, password_hash, email_verified_at, plan from users where email = $1`,
            [email],
        )
        const row = rows[0];
        const ok = await verifyPassword(row?.password_hash ?? DUMMY_HASH, body.password);

        if (!row || !ok) {
            reply.code(401).send({ error: 'invalid_credentials' });
            return;
        }
        if (row.email_verified_at === null) {
            reply.code(403).send({ error: 'email_not_verified' });
            return;
        }
        const sessionId = await createSession(row?.id);
        reply.setCookie('sid', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: conf.sessionTtl
        });
        await reset(byEmail);
        return { user_id: row.id, email, plan: row.plan };
    });

    app.post('/auth/logout', { onRequest: requireSession }, async (req, reply) => {
        const sid = req.cookies[conf.cookieName];
        if (sid) await destroySession(sid);
        reply.clearCookie(conf.cookieName, { path: '/' });
        reply.code(204).send();
    });

    app.get('/auth/session', { onRequest: requireSession }, async (req, reply) => {
        const { rows } = await query<{
            id: string; email: string; plan: string; email_verified_at: string | null
        }>(
            `select id, email, plan, email_verified_at from users where id = $1`,
            [req.session!.userId],
        );
        if (rows.length === 0) {
            reply.clearCookie(conf.cookieName, { path: '/' });
            reply.code(401).send({ error: 'not_authenticated' });
            return;
        }
        return {
            user_id: rows[0].id,
            email: rows[0].email,
            plan: rows[0].plan,
            email_verified: rows[0].email_verified_at !== null,
        };
    });
} 
