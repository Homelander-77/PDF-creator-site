'use client';

import { useEffect, useState } from 'react';
import { cn } from './ui';

/**
 * Боковая навигация с подсветкой текущего раздела.
 *
 * Активный пункт вычисляет IntersectionObserver, а не обработчик скролла:
 * тот срабатывал бы десятки раз в секунду и считал бы getBoundingClientRect
 * для каждого заголовка — самый быстрый способ уронить прокрутку на телефоне.
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
  );
}
