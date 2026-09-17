'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useCooldown } from '@/hooks/use-cooldown';
import { formatWait } from '@/lib/time';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
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
    setNeedsVerify(false);
    setLoading(true);

    try {
      await api.login(email, password);
      router.push('/dashboard');
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
    await api.resend(email).catch(() => {});
    setError('Письмо отправлено повторно — проверьте почту.');
    setNeedsVerify(false);
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
                className="mt-1 block underline underline-offset-2"
              >
                Выслать письмо ещё раз
              </button>
            )}
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
