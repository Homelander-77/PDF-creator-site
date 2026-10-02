'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useCooldown } from '@/hooks/use-cooldown';
import { formatWait } from '@/lib/time';
import { safeNext } from '@/lib/next-url';

function LoginForm() {
  const router = useRouter();
  // Откуда прислали на вход: со страницы оплаты, из кабинета по истёкшей
  // сессии. Раньше параметр игнорировался, и после входа человек всегда
  // оказывался в кабинете — например, вместо оплаты, которую начинал.
  const next = safeNext(useSearchParams().get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * Ограничитель на сервере считает по адресу и по IP. Когда он срабатывает,
   * сервер сообщает, сколько ещё ждать, — и это единственный случай, когда
   * повторять запрос бессмысленно не «наверное», а точно. Поэтому кнопка
   * гаснет до конца срока, а не предлагает потыкать ещё.
   */
  const cooldown = useCooldown();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cooldown.active) return;

    setError(null);
    setNotice(null);
    setNeedsVerify(false);
    setLoading(true);

    try {
      await api.login(email, password);
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.retryAfterSec) {
          // Текст берёт на себя счётчик ниже — он живой и не устареет
          // через секунду после показа.
          cooldown.start(err.retryAfterSec);
        } else {
          setError(err.message);
          // Отдельная ветка: человек всё сделал правильно, просто не дошёл
          // до почты. Показываем не «ошибку», а следующий шаг.
          if (err.code === 'email_not_verified') setNeedsVerify(true);
        }
      } else {
        setError('Что-то пошло не так.');
      }
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    try {
      await api.resend(email);
      // Успех — зелёным и отдельно от ошибки. Раньше «письмо отправлено»
      // показывалось в красной плашке, и читалось как очередной отказ.
      setError(null);
      setNotice(`Письмо отправлено на ${email} — проверьте почту и папку «Спам».`);
      setNeedsVerify(false);
    } catch (err) {
      // Сервер ограничивает повторные письма. На отказ нельзя отвечать
      // «отправлено» — человек будет ждать письма, которого нет.
      if (err instanceof ApiError && err.retryAfterSec) {
        cooldown.start(err.retryAfterSec);
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось отправить письмо.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Войдите, чтобы управлять ключами и смотреть потребление."
      footer={
        <>
          Нет аккаунта?{' '}
          <Link href="/register" className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent">
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Почта"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />

        <div>
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot"
              className="text-[13px] text-muted transition-colors hover:text-accent"
            >
              Забыли пароль?
            </Link>
          </div>
        </div>

        {cooldown.active && (
          <div
            role="alert"
            aria-live="polite"
            className="animate-fade-in rounded-[10px] border border-warning/25 bg-warning/8 px-3.5 py-2.5 text-[14px] text-warning"
          >
            Слишком много попыток входа. Повторить можно через{' '}
            <span className="font-medium tabular-nums">
              {formatWait(cooldown.left)}
            </span>
            .
          </div>
        )}

        {error && !cooldown.active && (
          <div
            role="alert"
            className="animate-fade-in rounded-[10px] border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[14px] text-danger"
          >
            {error}
            {needsVerify && (
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className="mt-1 block underline underline-offset-2 disabled:opacity-60"
              >
                {resending ? 'Отправляем…' : 'Выслать письмо ещё раз'}
              </button>
            )}
          </div>
        )}

        {notice && !error && (
          <div
            role="status"
            className="animate-fade-in rounded-[10px] border border-success/25 bg-success/8 px-3.5 py-2.5 text-[14px] text-success"
          >
            {notice}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={cooldown.active}
          className="w-full"
        >
          {cooldown.active ? (
            <span className="tabular-nums">
              Повтор через {formatWait(cooldown.left)}
            </span>
          ) : (
            'Войти'
          )}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  // useSearchParams требует границы Suspense — иначе Next не соберёт
  // страницу статически.
  return (
    <Suspense fallback={<AuthShell title="С возвращением"><div /></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}
