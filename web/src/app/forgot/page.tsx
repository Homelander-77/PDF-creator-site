'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { useCooldown } from '@/hooks/use-cooldown';
import { formatWait } from '@/lib/time';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Здесь окно ограничителя длинное — три письма в три часа, — поэтому
   * счётчик показывает часы и минуты. Без него человек видел бы «слишком
   * много попыток» и не понимал, ждать минуту или до завтра.
   */
  const cooldown = useCooldown();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (cooldown.active) return;

    setError(null);
    setLoading(true);
    try {
      await api.forgot(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.retryAfterSec) {
        cooldown.start(err.retryAfterSec);
      } else {
        setError(err instanceof ApiError ? err.message : 'Что-то пошло не так.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={sent ? 'Письмо отправлено' : 'Восстановление доступа'}
      subtitle={
        sent
          ? 'Если такой адрес зарегистрирован, ссылка для смены пароля уже в почте. Она действует час.'
          : 'Укажите почту — пришлём ссылку для смены пароля.'
      }
      footer={
        <Link href="/login" className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent">
          Вернуться ко входу
        </Link>
      }
    >
      {sent ? (
        <div className="animate-fade-up rounded-[14px] border border-border bg-elevated p-6 text-center text-[14.5px] leading-relaxed text-muted">
          Не пришло за пару минут — проверьте спам и правильность адреса.
        </div>
      ) : (
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

          {cooldown.active && (
            <div
              role="alert"
              aria-live="polite"
              className="animate-fade-in rounded-[10px] border border-warning/25 bg-warning/8 px-3.5 py-2.5 text-[14px] text-warning"
            >
              Ссылку уже отправляли несколько раз. Следующая будет доступна
              через{' '}
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
              'Отправить ссылку'
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
