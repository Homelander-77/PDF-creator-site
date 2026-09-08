// src/routes/account-session.ts
//
// Маршруты личного кабинета. Делают то же, что /v1/*, но пускают по
// СЕССИОННОЙ КУКЕ, а не по API-ключу.
//
// Почему отдельный файл, а не «разрешить куке ходить в /v1/*»:
// смешивать две системы аутентификации нельзя. Как только один хук начнёт
// принимать и куку, и ключ, любая ошибка в нём сделает сессионную куку
// полноценным API-ключом — а она живёт в браузере, где до неё дотягиваются
// XSS и CSRF. Ключи для машин, куки для браузера, разные двери.
//
// ВНИМАНИЕ: проверьте путь импорта requireSession — у меня он в session-auth.js,
// у вас может лежать в другом файле.

import type { FastifyInstance } from 'fastify';
import { requireSession } from '../session-auth.js';
import { createKey, revokeKey } from '../key.js';
import { query } from '../db.js';
import { getPlan, currentPeriod } from '../plans.js';
import { getUsage } from '../quota.js';

export async function accountSessionRoutes(app: FastifyInstance): Promise<void> {
  /** Тариф и потребление — то же, что GET /v1/me, но по сессии. */
  app.get('/account/me', { onRequest: requireSession }, async (req, reply) => {
    const { rows } = await query<{ plan: string }>(
      `SELECT plan FROM users WHERE id = $1`,
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
    };
  });

  /** Список ключей. key_hash наружу не выходит никогда. */
  app.get('/account/keys', { onRequest: requireSession }, async (req) => {
    const { rows } = await query(
      `SELECT id, name, key_prefix, last_used_at, created_at
         FROM api_keys
        WHERE user_id = $1 AND revoked_at IS NULL
        ORDER BY created_at`,
      [req.session!.userId],
    );
    return { keys: rows };
  });

  /** Выпуск ключа. Только после подтверждения почты. */
  app.post('/account/keys', { onRequest: requireSession }, async (req, reply) => {
    const { rows } = await query<{ email_verified_at: string | null }>(
      `SELECT email_verified_at FROM users WHERE id = $1`,
      [req.session!.userId],
    );

    if (rows.length === 0) return reply.code(401).send({ error: 'not_authenticated' });

    if (rows[0].email_verified_at === null) {
      return reply.code(403).send({
        error: 'email_not_verified',
        message: 'Подтвердите адрес почты, чтобы выпускать ключи.',
      });
    }

    const b = (req.body ?? {}) as { name?: unknown };
    const name =
      typeof b.name === 'string' && b.name.trim().length > 0
        ? b.name.trim().slice(0, 64)
        : 'default';

    const key = await createKey(req.session!.userId, name);

    return reply.code(201).send({
      id: key.id,
      name,
      prefix: key.prefix,
      api_key: key.raw, // единственный раз за всю жизнь ключа
      warning: 'Сохраните ключ: показать его повторно невозможно.',
    });
  });

  /** Отзыв. userId из сессии, не из запроса — иначе отзовут чужой. */
  app.delete('/account/keys/:id', { onRequest: requireSession }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const ok = await revokeKey(id, req.session!.userId);
    if (!ok) return reply.code(404).send({ error: 'key_not_found' });
    return reply.code(204).send();
  });

  /** История потребления по месяцам. */
  app.get('/account/usage', { onRequest: requireSession }, async (req) => {
    const { rows } = await query(
      `SELECT period,
              count(*)::int                AS requests,
              coalesce(sum(pages), 0)::int AS pages
         FROM usage_records
        WHERE user_id = $1
        GROUP BY period
        ORDER BY period DESC
        LIMIT 12`,
      [req.session!.userId],
    );
    return { history: rows };
  });
}
