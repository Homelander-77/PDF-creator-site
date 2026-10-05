'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/components/ui';

/**
 * Живой статус в подвале вместо надписи «все системы в норме», которая
 * была вписана в код и висела, даже когда API лежал.
 *
 * Формат ответа /health (бэкенд):
 *   { status: 'ok' | 'degraded', postgres, redis, renderer }
 *   200 — всё работает, 503 — что-то из трёх лежит.
 *
 * Обычный api.request тут не подходит: на 503 он бросает ошибку, а нам
 * нужно тело — какой именно компонент отказал.
 */
type Health = { status: 'ok' | 'degraded'; postgres: boolean; redis: boolean; renderer: boolean };
type State = { kind: 'checking' } | { kind: 'ok' } | { kind: 'degraded'; broken: string[] } | { kind: 'down' };

const NAMES: Record<string, string> = { postgres: 'база', redis: 'кеш', renderer: 'рендер' };
const EVERY_MS = 60_000;

async function check(): Promise<State> {
  try {
    const res = await fetch('/api/health', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const body = (await res.json()) as Partial<Health>;
    if (body.status === 'ok') return { kind: 'ok' };
    if (body.status === 'degraded') {
      const broken = (['postgres', 'redis', 'renderer'] as const)
        .filter((k) => body[k] === false)
        .map((k) => NAMES[k]);
      return { kind: 'degraded', broken };
    }
    return { kind: 'down' };
  } catch {
    // Сеть, таймаут или прокси Next отдал 500 без JSON — значит, API не отвечает.
    return { kind: 'down' };
  }
}

export function FooterStatus() {
  const [state, setState] = useState<State>({ kind: 'checking' });

  useEffect(() => {
    let alive = true;
    const run = () => {
      // Вкладка в фоне — не дёргаем сервер зря, проверим при возвращении.
      if (document.visibilityState !== 'visible') return;
      void check().then((s) => alive && setState(s));
    };
    run();
    const id = setInterval(run, EVERY_MS);
    document.addEventListener('visibilitychange', run);
    return () => {
      alive = false;
      clearInterval(id);
      document.removeEventListener('visibilitychange', run);
    };
  }, []);

  const view = {
    checking: { dot: 'bg-border-strong', text: 'проверяем…' },
    ok: { dot: 'bg-success', text: 'все системы в норме' },
    degraded: {
      dot: 'bg-warning',
      text:
        state.kind === 'degraded' && state.broken.length > 0
          ? `неполадки: ${state.broken.join(', ')}`
          : 'частичные неполадки',
    },
    down: { dot: 'bg-danger', text: 'API недоступен' },
  }[state.kind];

  return (
    <span className="inline-flex items-center gap-2 font-mono" role="status" aria-live="polite">
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', view.dot)} />
      status: {view.text}
    </span>
  );
}
