'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from './ui';

/**
 * Навигация по документации.
 *
 * Активный раздел вычисляет IntersectionObserver, а не обработчик скролла:
 * тот срабатывал бы десятки раз в секунду и считал бы getBoundingClientRect
 * для каждого заголовка — самый быстрый способ уронить прокрутку на телефоне.
 *
 * Раскладок две, и это не оформление, а разные способы пользоваться. На
 * широком экране список всегда на виду сбоку. На телефоне места для него
 * нет, и раньше он там просто прятался — по странице в сорок экранов
 * оставалось только листать. Теперь сверху полоса с названием текущего
 * раздела: она показывает, где ты находишься, и по нажатию разворачивается
 * в тот же список.
 */
export function DocsNav({
  sections,
}: {
  sections: Array<{ id: string; title: string }>;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((e): e is HTMLElement => e !== null);

    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <>
      <MobileNav sections={sections} active={active} />

      <aside className="hidden w-52 shrink-0 lg:block">
        <nav className="sticky top-24">
          <div className="mb-3 text-[12px] font-medium uppercase tracking-wider text-subtle">
            Разделы
          </div>
          <ul className="space-y-0.5 border-l border-border">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    '-ml-px block border-l-2 py-1.5 pl-4 text-[14px]',
                    'transition-[color,border-color] duration-200',
                    active === s.id
                      ? 'border-accent font-medium text-fg'
                      : 'border-transparent text-muted hover:border-border-strong hover:text-fg',
                  )}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

/* ------------------------------ Телефон -------------------------------- */

function MobileNav({
  sections,
  active,
}: {
  sections: Array<{ id: string; title: string }>;
  active: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const current = sections.find((s) => s.id === active) ?? sections[0];

  /**
   * Закрытие по нажатию мимо и по Escape.
   *
   * Слушатели живут только пока список раскрыт: держать их всю сессию ради
   * кнопки, которую нажимают раз в несколько минут, незачем.
   */
  useEffect(() => {
    if (!open) return;

    function onPointer(e: PointerEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={box}
      /**
       * top-16 — ровно под шапкой сайта: она тоже липкая и высотой 4rem.
       * Отрицательные поля по бокам растягивают полосу на всю ширину,
       * компенсируя отступы страницы, — иначе она выглядит как случайная
       * карточка посреди текста.
       */
      className="sticky top-16 z-30 -mx-5 mb-6 border-b border-border bg-bg/90 backdrop-blur-md lg:hidden"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="docs-sections"
        className="flex w-full items-center gap-2 px-5 py-3 text-left"
      >
        <span className="shrink-0 text-[12px] uppercase tracking-wider text-subtle">
          Раздел
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
          {current?.title}
        </span>
        <svg
          className={cn(
            'shrink-0 text-subtle transition-transform duration-200',
            open && 'rotate-180',
          )}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          id="docs-sections"
          /**
           * Список ложится поверх текста, а не раздвигает его. В потоке
           * он сдвигал бы вниз всё, что ниже, — и страница прыгала бы под
           * пальцем ровно в тот момент, когда по ней целятся.
           */
          className="animate-fade-in absolute inset-x-0 top-full max-h-[60vh] overflow-y-auto border-b border-border bg-bg px-2 py-2 shadow-[var(--shadow-lg)]"
        >
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={() => setOpen(false)}
                aria-current={active === s.id ? 'true' : undefined}
                className={cn(
                  'block rounded-[8px] px-3 py-2 text-[14px]',
                  active === s.id
                    ? 'bg-accent-soft font-medium text-fg'
                    : 'text-muted',
                )}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
