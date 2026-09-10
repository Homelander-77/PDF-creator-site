'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { PasswordRules } from '@/components/password-rules';
import { Button, Input } from '@/components/ui';
import { ApiError, api } from '@/lib/api';
import { isValidPassword } from '@/lib/password';

function ResetForm() {
  const router = useRouter();
  // Токен приходит в адресе письма. Страница достаёт его отсюда и кладёт
  // в тело запроса — в query он бы осел в логах и истории браузера.
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const mismatch = repeat.length > 0 && password !== repeat;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (mismatch) return;
    setError(null);
    setLoading(true);
    try {
      await api.reset(token, password);
      setDone(true);
      setTimeout(() => router.push('/login'), 2200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Что-то пошло не так.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell
        title="Ссылка неполная"
        subtitle="В адресе нет токена. Скорее всего, ссылку скопировали не целиком."
        footer={
          <Link href="/forgot" className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent">
            Запросить новую ссылку
          </Link>
        }
      >
        <div />
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell
        title="Пароль изменён"
        subtitle="Все прежние сессии завершены. Сейчас перебросим на вход."
      >
        <div className="animate-fade-up rounded-[14px] border border-border bg-elevated p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Новый пароль"
      subtitle="После смены все активные сессии будут завершены — на всех устройствах."
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Новый пароль"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Например: Гора#Море42"
        />
        <PasswordRules value={password} />

        <Input
          label="Повторите"
          type="password"
          autoComplete="new-password"
          required
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          error={mismatch ? 'Пароли не совпадают.' : undefined}
        />

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
          disabled={!isValidPassword(password) || mismatch}
          className="w-full"
        >
          Сменить пароль
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPage() {
  // useSearchParams требует границы Suspense — без неё Next не сможет
  // отрендерить страницу статически на этапе сборки.
  return (
    <Suspense fallback={<AuthShell title="Загрузка…"><div /></AuthShell>}>
      <ResetForm />
    </Suspense>
  );
}
