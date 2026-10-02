'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, ButtonLink, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useCooldown } from '@/hooks/use-cooldown';
import { formatWait } from '@/lib/time';

type State = 'checking' | 'ok' | 'fail' | 'offline';

/**
 * Один запрос на токен, сколько бы раз ни запустился эффект.
 *
 * Токен одноразовый: первый запрос его тратит, второй получает «ссылка
 * использована». А React в режиме разработки запускает эффекты дважды —
 * и человек с только что подтверждённой почтой видел «ссылка не
 * сработала». Кешируем сам промис: второй запуск ждёт тот же ответ.
 */
const inflight = new Map<string, Promise<unknown>>();
function verifyOnce(token: string) {
  let p = inflight.get(token);
  if (!p) {
    p = api.verify(token);
    inflight.set(token, p);
  }
  return p;
}

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<State>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) {
      setState('fail');
      return;
    }
    let alive = true;
    verifyOnce(token)
      .then(() => alive && setState('ok'))
      .catch((err) => {
        if (!alive) return;
        // Сеть или 5xx — ссылка, скорее всего, жива. Нельзя говорить
        // «устарела»: человек пойдёт запрашивать новую без нужды.
        const broken = err instanceof ApiError && err.status >= 400 && err.status < 500;
        if (!broken) inflight.delete(token);
        setState(broken ? 'fail' : 'offline');
      });
    return () => {
      alive = false;
    };
  }, [token, attempt]);

  if (state === 'checking') {
    return (
      <AuthShell title="Проверяем ссылку…">
        <div className="flex justify-center py-6">
          <span className="animate-spin-slow h-7 w-7 rounded-full border-2 border-accent border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  if (state === 'ok') {
    return (
      <AuthShell
        title="Почта подтверждена"
        subtitle="Теперь можно войти и выпустить первый ключ."
      >
        <div className="animate-fade-up space-y-6">
          <div className="rounded-[14px] border border-border bg-elevated p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </div>
          <ButtonLink href="/login" size="lg" className="block w-full">Войти</ButtonLink>
        </div>
      </AuthShell>
    );
  }

  if (state === 'offline') {
    return (
      <AuthShell
        title="Не удалось проверить ссылку"
        subtitle="Сервер не ответил. Ссылка, скорее всего, в порядке — попробуйте ещё раз."
      >
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            setState('checking');
            setAttempt((n) => n + 1);
          }}
        >
          Повторить
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Ссылка не сработала"
      subtitle="Она устарела, уже использована или скопирована не полностью. Ссылки живут сутки."
      footer={
        <Link href="/login" className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent">
          Перейти ко входу
        </Link>
      }
    >
      <ResendForm />
    </AuthShell>
  );
}

/**
 * Новое письмо — прямо здесь.
 *
 * Раньше страница отправляла «запросить на странице входа», но там кнопка
 * повторной отправки появляется только после попытки войти с верным
 * паролем. Человек шёл туда и не находил её.
 */
function ResendForm() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldown = useCooldown();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cooldown.active) return;
    setSending(true);
    setError(null);
    try {
      await api.resend(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.retryAfterSec) cooldown.start(err.retryAfterSec);
      else setError(err instanceof ApiError ? err.message : 'Не удалось отправить письмо.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="animate-fade-in rounded-[14px] border border-success/25 bg-success/8 p-6 text-center text-[14.5px] leading-relaxed text-success"
      >
        Если {email} зарегистрирован и ещё не подтверждён, новая ссылка уже
        в почте. Загляните и в «Спам».
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input
        label="Почта, на которую регистрировались"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />
      {error && !cooldown.active && (
        <div
          role="alert"
          className="animate-fade-in rounded-[10px] border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[14px] text-danger"
        >
          {error}
        </div>
      )}
      <Button
        type="submit"
        size="lg"
        loading={sending}
        disabled={cooldown.active}
        className="w-full"
      >
        {cooldown.active ? (
          <span className="tabular-nums">Повтор через {formatWait(cooldown.left)}</span>
        ) : (
          'Прислать новую ссылку'
        )}
      </Button>
    </form>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthShell title="Проверяем ссылку…"><div /></AuthShell>}>
      <Verify />
    </Suspense>
  );
}
