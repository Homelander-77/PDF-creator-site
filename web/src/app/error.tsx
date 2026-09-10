'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';

/**
 * Страница неожиданной ошибки.
 *
 * Без неё падение любого компонента показывает служебный экран Next —
 * без темы, без шапки, с текстом на английском. Здесь же человек видит
 * понятное объяснение и кнопку «Попробовать снова», которая перемонтирует
 * ветку, а не перезагружает весь сайт.
 *
 * Текст самой ошибки наружу не выводим: в нём бывают внутренние пути
 * и детали устройства сервера. В консоль — да, пользователю — нет.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app]', error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <div className="animate-fade-up">
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-danger/10 text-danger">
          <svg
            width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          >
            <path d="M12 8v5M12 17h.01" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </span>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px]">
          Что-то пошло не так
        </h1>

        <p className="mx-auto mt-3 max-w-[44ch] text-[16px] leading-relaxed text-muted">
          Мы уже знаем о проблеме. Попробуйте повторить — обычно помогает.
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-[12px] text-subtle">
            код: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset}>
            Попробовать снова
          </Button>
          <Link href="/">
            <Button size="lg" variant="secondary">
              На главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
