'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button, Skeleton } from '@/components/ui';
import { useSession } from '@/hooks/use-session';

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
      <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-5">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-accent text-accent-fg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
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
