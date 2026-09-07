'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui';
import { api } from '@/lib/api';

type State = 'checking' | 'ok' | 'fail';

function Verify() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    if (!token) {
      setState('fail');
      return;
    }
    let alive = true;
    api
      .verify(token)
      .then(() => alive && setState('ok'))
      .catch(() => alive && setState('fail'));
    return () => {
      alive = false;
    };
  }, [token]);

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
          <Link href="/login" className="block">
            <Button size="lg" className="w-full">
              Войти
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Ссылка не сработала"
      subtitle="Она устарела, уже использована или скопирована не полностью. Ссылки живут сутки."
      footer={
        <Link href="/login" className="text-accent hover:underline">
          Перейти ко входу
        </Link>
      }
    >
      <div className="rounded-[14px] border border-border bg-elevated p-6 text-center text-[14.5px] leading-relaxed text-muted">
        Запросить новую можно на странице входа — там есть кнопка отправить
        письмо повторно.
      </div>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<AuthShell title="Проверяем ссылку…"><div /></AuthShell>}>
      <Verify />
    </Suspense>
  );
}
