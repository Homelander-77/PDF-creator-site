import Link from 'next/link';
import type { ReactNode } from 'react';
import { ThemeToggle } from './theme-toggle';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div className="aurora opacity-30" aria-hidden />

      <header className="flex items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-accent text-accent-fg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <span>pdfapi</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="animate-fade-up w-full max-w-[400px]">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>
          )}

          <div className="mt-7">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-[14px] text-muted">{footer}</div>
          )}
        </div>
      </main>
    </div>
  );
}
