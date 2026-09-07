'use client';

import Link from 'next/link';
import { useMemo, useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button, Input, cn } from '@/components/ui';
import { ApiError, api } from '@/lib/api';

/** Грубая оценка стойкости — только чтобы дать обратную связь во время ввода. */
function strength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < 10) return { score: 0, label: 'Слишком короткий' };
  let s = 1;
  if (pw.length >= 16) s++;
  if (/\s/.test(pw) && pw.trim().split(/\s+/).length >= 3) s++;
  else if (/[^a-zA-Zа-яА-Я0-9]/.test(pw) && /\d/.test(pw)) s++;
  const score = Math.min(s, 3) as 1 | 2 | 3;
  return { score, label: ['', 'Приемлемо', 'Хорошо', 'Отлично'][score] };
}

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const st = useMemo(() => strength(password), [password]);

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
            placeholder="Минимум 10 символов"
            hint="Длинная фраза надёжнее короткой мешанины символов."
          />

          {password.length > 0 && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-300',
                      st.score >= i ? 'bg-accent' : 'bg-border',
                    )}
                  />
                ))}
              </div>
              <span className="w-[76px] text-right text-[12px] text-subtle">
                {st.label}
              </span>
            </div>
          )}
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
          disabled={st.score === 0}
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
