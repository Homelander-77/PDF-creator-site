'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, Skeleton } from '@/components/ui';
import { useSession } from '@/hooks/use-session';
import { Logo } from '@/components/logo';

/**
 * Шапка кабинета и охрана входа.
 *
 * Раньше всё это лежало прямо в app/dashboard/layout.tsx. Пришлось вынести:
 * layout понадобилось сделать серверным, чтобы он мог отдать заголовок
 * страницы, а здешний код без браузера не живёт — ему нужны состояние
 * сессии, переходы и обработчик выхода. Логика не изменилась ни на строку,
 * сменилось только место.
 */
export function DashboardChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === 'anonymous') router.replace('/login');
  }, [session.status, router]);

  // Пока сессия не подтверждена — скелет, а не содержимое кабинета.
  // Показывать данные до проверки нельзя: они мигнут у неавторизованного.
  if (session.status !== 'authenticated') {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-32 w-full" />
        <Skeleton className="mt-4 h-56 w-full" />
      </div>
    );
  }

  const { session: me, logout } = session;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo />
            <span className="hidden sm:inline">pdfapi</span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 sm:flex">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-sm text-fg transition-colors hover:bg-accent-soft"
            >
              Ключи
            </Link>
            <Link
              href="/docs"
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:bg-accent-soft hover:text-fg"
            >
              Документация
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-[13px] text-subtle md:inline">
              {me.email}
            </span>
            <ThemeToggle />
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                await logout();
                router.replace('/');
              }}
            >
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
