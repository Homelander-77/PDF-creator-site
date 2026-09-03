import type { FastifyInstance } from 'fastify';
import { conf } from '../config.js';
import { query } from '../db.js';
import { hashPassword, validatePassword } from '../passwords.js';
import { issueToken, consumeToken } from '../tokens.js';
import { mailer, verificationEmail, accountExistsEmail, resetEmail } from '../mailer.js'
import { normalizeEmail } from '../normalizer.js'
import { authenticate } from '../auth.js';
import { hit } from '../ratelimits.js';
import { send } from 'process';
import { destroyAllSessions } from '../session.js';


export async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post('/auth/register', async (req, reply) => {
        const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
        const email = normalizeEmail(body.email);
        if (!email) {
            return reply.code(400).send({ error: 'invalid_email' });
        }
        const passwordError = validatePassword(body.password);
        if (passwordError) {
            return reply.code(400).send({ error: 'weak_password', message: passwordError });
        }
        const passwordHash = await hashPassword(body.password as string);
        const existing = await query<{ id: string, password_hash: string | null }>(
            `select id, password_hash from users where email = $1`,
            [email],
        );
        let userId: string;
        if (existing.rows.length > 0 && existing.rows[0].password_hash !== null) {
            await mailer.send(accountExistsEmail(email));
            await reply.code(202).send({
                status: 'pending_verification',
                message: 'If address is free, we will send you email with auth.',
            })
            return;
        }
        if (existing.rows.length > 0) {
            userId = existing.rows[0].id;
            await query(`update users set password_hash = $1 where id = $2`, [passwordHash, userId],)
        } else {
            const inserted = await query<{ id: string }>(
                `insert into users (email, password_hash) values ($1, $2) returning id`,
                [email, passwordHash],
            );
            userId = inserted.rows[0].id;
        }
        const token = await issueToken(userId, 'verify', conf.verifyTokenTtl);
        await mailer.send(
            verificationEmail(email, `${conf.appUrl}/auth/verify?token=${token}`),
        );
        return reply.code(202).send({
            status: 'pending_verification',
            message: 'If address is free, we will send you email with auth.',
        });
    });

    app.get('/auth/verify', async (req, reply) => {
        const { token } = req.query as { token?: string };
        if (!token) return reply.code(400).send({ error: 'missing_token' });
        const userId = await consumeToken(token, 'verify');
        if (!userId) {
            return reply.code(400).send({
                error: 'invalid_or_expired_token',
                message: 'Link is unvaliable',
            });
        }
        await query(
            `update users set email_verified_at = now()
             where id = $1 and email_verified_at is null`,
            [userId],
        );
        return { status: 'verified' };
    });

    app.post('/auth/resend', async (req, reply) => {
        const email = normalizeEmail((req.body as { email?: unknown } | undefined)?.email);
        const generic = {
            status: 'sent',
            message: 'If address was registrated and not applied, we sent email.'
        };
        if (!email) return reply.code(202).send(generic);
        const { rows } = await query<{ id: string, email_verified_at: string | null }>(
            `select id, email_verified_at from users
             where email = $1 and password_hash is not null`,
            [email],
        );
        if (rows.length === 0 || rows[0].email_verified_at !== null) {
            return reply.code(202).send(generic);
        }
        const token = await issueToken(rows[0].id, 'verify', conf.verifyTokenTtl);
        await mailer.send(verificationEmail(email, `${conf.appUrl}/auth/verify?token=${token}`));
        return reply.code(202).send(generic);
    });

    app.post('/auth/forgot', async (req, reply) => {
        const email = normalizeEmail((req.body as { email?: unknown } | undefined)?.email);
        const generic = {
            status: 'sent',
            message: 'Reset message was sended to your email.'
        };
        if (!email) return reply.code(202).send(generic);
        const byEmail = `reset:${email}`;
        const [e] = await Promise.all([hit(byEmail, 3, 60 * 60 * 3)]);
        if (!e.allowed) {
            reply.header('Retry-After', e.retryAfterSec);
            reply.code(429).send({ error: 'too_many_attempts', retry_after_sec: e.retryAfterSec });
            return;
        }
        const { rows } = await query<{ id: string }>(
            `select id from users
             where email = $1 and email_verified_at is not null`,
            [email],
        );
        if (rows.length === 0 || !rows[0].id) {
            reply.code(202).send();
            return;
        }
        const token = await issueToken(rows[0].id, 'reset', conf.resetTokenTtl);
        await mailer.send(resetEmail(email, `${conf.appUrl}/auth/reset?token=${token}`));
    });

    app.post('/auth/reset', async (req, reply) => {
        const { token, password } = (req.body ?? {}) as { token?: unknown, password?: unknown };
        if (!token || typeof token !== 'string') return reply.code(400).send({ error: 'missing_token' });
        if (!password || typeof password !== 'string') {
            reply.code(400).send({ error: 'bad_request' });
            return;
        }
        const passwordError = validatePassword(password);
        if (passwordError) {
            return reply.code(400).send({ error: 'weak_password', message: passwordError });
        }
        const passwordHash = await hashPassword(password);
        const userId = await consumeToken(token, 'reset');
        if (!userId) {
            reply.code(400).send({ error: 'invalid_or_expired_token' });
            return;
        }
        await query(
            `update users set password_hash = $1,
             email_verified_at = coalesce(email_verified_at, now())
             where id = $2`,
            [passwordHash, userId],
        );
        await destroyAllSessions(userId);
        return { staftus: 'password_changed' }
    });
}
