'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from './theme-toggle';
import { Button, cn } from './ui';
import { useSession } from '@/hooks/use-session';

const NAV = [
  { href: '/#features', label: 'Возможности' },
  { href: '/#pricing', label: 'Тарифы' },
  { href: '/docs', label: 'Документация' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const session = useSession();

  useEffect(() => {
    // passive: true — обещаем не звать preventDefault, и браузер может
    // не ждать наш обработчик перед прокруткой. На телефоне это заметно.
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full',
        'transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-border bg-bg/80 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>pdfapi</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition-colors duration-200 hover:bg-accent-soft hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          <div className="hidden items-center gap-2 sm:flex">
            {session.status === 'authenticated' ? (
              <Link href="/dashboard">
                <Button size="sm">Кабинет</Button>
              </Link>
            ) : session.status === 'anonymous' ? (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost">
                    Войти
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Начать</Button>
                </Link>
              </>
            ) : (
              // Пока сессия неизвестна — держим место, чтобы шапка не прыгала.
              <div className="h-8 w-32" />
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Меню"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-accent-soft hover:text-fg md:hidden"
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </div>

      {/* Мобильное меню: сдвигается трансформом, а не меняет height —
          анимация height дёргает раскладку на каждом кадре. */}
      <div
        className={cn(
          'overflow-hidden border-t border-border bg-bg md:hidden',
          'transition-[max-height,opacity] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          open ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-2.5 text-[15px] text-muted transition-colors hover:bg-accent-soft hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-2 flex gap-2 border-t border-border pt-3">
            {session.status === 'authenticated' ? (
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Кабинет</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Войти
                  </Button>
                </Link>
                <Link href="/register" className="flex-1">
                  <Button className="w-full">Начать</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-accent text-accent-fg">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    </span>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line
        x1="3" y1="7" x2="21" y2="7"
        className="origin-center transition-transform duration-300"
        style={{ transform: open ? 'translateY(5px) rotate(45deg)' : undefined }}
      />
      <line
        x1="3" y1="17" x2="21" y2="17"
        className="origin-center transition-transform duration-300"
        style={{ transform: open ? 'translateY(-5px) rotate(-45deg)' : undefined }}
      />
    </svg>
  );
}
