'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { PasswordRules } from '@/components/password-rules';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { isValidPassword } from '@/lib/password';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const valid = useMemo(() => isValidPassword(password), [password]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register(email, password);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthShell
        title="Проверьте почту"
        subtitle={`Мы отправили ссылку подтверждения на ${email}. Перейдите по ней, чтобы завершить регистрацию.`}
        footer={
          <>
            Письмо не пришло?{' '}
            <button
              onClick={() => api.resend(email).catch(() => {})}
              className="text-accent hover:underline"
            >
              Отправить ещё раз
            </button>
          </>
        }
      >
        <div className="animate-fade-up rounded-[14px] border border-border bg-elevated p-6 text-center">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-10 6L2 7" />
            </svg>
          </span>
          <p className="text-[14.5px] leading-relaxed text-muted">
            Ссылка действует сутки. Если письма нет — загляните в спам.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="100 страниц в месяц бесплатно. Карта не нужна."
      footer={
        <>
          Уже есть аккаунт?{' '}
          <Link href="/login" className="text-accent hover:underline">
            Войти
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
            autoComplete="new-password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Например: Гора#Море42"
          />
          <PasswordRules value={password} />
        </div>

        {error && (
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
          disabled={!valid}
          className="w-full"
        >
          Создать аккаунт
        </Button>

        <p className="text-center text-[12.5px] leading-relaxed text-subtle">
          Регистрируясь, вы соглашаетесь с условиями использования.
        </p>
      </form>
    </AuthShell>
  );
}
