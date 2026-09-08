/**
 * Тонкая обёртка над fetch.
 *
 * Все запросы идут на /api/* — тот же источник, что и страница. Переписывание
 * на Fastify делает Next (см. next.config.ts). Поэтому здесь нет ни CORS,
 * ни абсолютных адресов, ни credentials: 'include' — браузер и так шлёт куку
 * на свой же домен.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfterSec?: number,
  ) {
    super(message);
  }
}

/**
 * Коды, по которым сервер знает больше нас.
 *
 * Для них его текст точнее любой общей формулировки: сервер проверяет
 * несколько правил и говорит, какое именно нарушено. Подменять это
 * фразой из словаря — значит скрыть от человека настоящую причину.
 * Ровно на этом сюда попадала «пароль слишком короткий» при нормальной
 * длине, но без спецсимвола.
 */
const PREFER_SERVER_MESSAGE = new Set(['weak_password', 'invalid_request']);

/** Человеческие формулировки вместо кодов. Ошибка — тоже часть интерфейса. */
const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Неверный адрес или пароль.',
  invalid_email: 'Проверьте адрес почты.',
  weak_password: 'Пароль не отвечает требованиям.',
  email_not_verified: 'Подтвердите адрес почты, ссылка была в письме.',
  not_authenticated: 'Нужно войти заново.',
  too_many_attempts: 'Слишком много попыток. Подождите минуту.',
  invalid_or_expired_token: 'Ссылка устарела или уже использована.',
  missing_token: 'В ссылке нет токена.',
  key_not_found: 'Ключ не найден.',
  quota_exceeded: 'Исчерпан месячный лимит страниц.',
  rate_limit_exceeded: 'Слишком часто. Сбавьте темп.',
};

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    // Сеть недоступна — отдельный случай, его нельзя путать с 500.
    throw new ApiError(0, 'network', 'Нет связи с сервером.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}) as Record<string, unknown>);

  if (!res.ok) {
    const code = String((data as { error?: string }).error ?? 'unknown');
    const retry = (data as { retry_after_sec?: number }).retry_after_sec;
    const fromServer = (data as { message?: string }).message;

    const message = PREFER_SERVER_MESSAGE.has(code)
      ? (fromServer ?? MESSAGES[code] ?? 'Что-то пошло не так.')
      : (MESSAGES[code] ?? fromServer ?? 'Что-то пошло не так.');

    throw new ApiError(res.status, code, String(message), retry);
  }

  return data as T;
}

const body = (v: unknown) => JSON.stringify(v);

/* ------------------------------- Типы ---------------------------------- */

export interface Session {
  user_id: string;
  email: string;
  plan: string;
  email_verified: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
}

export interface NewApiKey {
  id: string;
  name: string;
  prefix: string;
  api_key: string;
}

export interface Me {
  user_id: string;
  plan: string;
  period: string;
  usage: {
    pages_used: number;
    pages_limit: number;
    pages_remaining: number;
  };
  limits: {
    requests_per_second: number;
    burst: number;
  };
}

/* ------------------------------ Методы --------------------------------- */

export const api = {
  register: (email: string, password: string) =>
    request<{ status: string; message: string }>('/auth/register', {
      method: 'POST',
      body: body({ email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ user_id: string; email: string; plan: string }>('/auth/login', {
      method: 'POST',
      body: body({ email, password }),
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  session: () => request<Session>('/auth/session'),

  resend: (email: string) =>
    request<{ status: string }>('/auth/resend', {
      method: 'POST',
      body: body({ email }),
    }),

  forgot: (email: string) =>
    request<{ status: string }>('/auth/forgot', {
      method: 'POST',
      body: body({ email }),
    }),

  reset: (token: string, password: string) =>
    request<{ status: string }>('/auth/reset', {
      method: 'POST',
      body: body({ token, password }),
    }),

  verify: (token: string) =>
    request<{ status: string }>(`/auth/verify?token=${encodeURIComponent(token)}`),

  /* ---- Кабинет: по сессионной куке, НЕ по API-ключу ------------------- *
   *
   * Раньше эти методы били в /v1/*, но там стоит хук authenticate, который
   * ждёт заголовок с ключом. Браузер шлёт куку — получался стабильный 401.
   *
   * /account/* делает ровно то же самое, но пускает по сессии. Две системы
   * аутентификации остаются раздельными: ключи для машин, куки для браузера.
   */

  me: () => request<Me>('/account/me'),

  keys: () => request<{ keys: ApiKey[] }>('/account/keys'),

  createKey: (name: string) =>
    request<NewApiKey>('/account/keys', { method: 'POST', body: body({ name }) }),

  revokeKey: (id: string) =>
    request<void>(`/account/keys/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
