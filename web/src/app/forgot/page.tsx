'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.forgot(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так.');
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
        <Link href="/login" className="text-accent hover:underline">
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

          {error && (
            <div
              role="alert"
              className="animate-fade-in rounded-[10px] border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[14px] text-danger"
            >
              {error}
            </div>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Отправить ссылку
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
