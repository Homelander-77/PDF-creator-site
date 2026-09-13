'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchDocs, type DocEntry } from '@/lib/docs-index';

/**
 * Поиск по документации.
 *
 * Открывается по Cmd+K (Ctrl+K) или по «/» — так это устроено у всех, кто
 * пишет документацию для разработчиков, и люди пробуют эти клавиши не
 * глядя. Ищет по указателю из lib/docs-index.ts прямо в браузере: всё
 * содержимое умещается в пару килобайт, обращаться на сервер незачем.
 */
export function DocsSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [mac, setMac] = useState<boolean | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Куда вернуть фокус после закрытия — иначе он улетает в начало страницы. */
  const opener = useRef<HTMLElement | null>(null);

  const results = searchDocs(query);

  /**
   * Подпись на кнопке зависит от системы, а значит, не может быть
   * определена на сервере: там неизвестно, кто откроет страницу.
   * Поэтому до появления в браузере не пишем ничего.
   */
  useEffect(() => {
    setMac(/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
    opener.current?.focus();
  }, []);

  /* --------------------------- Горячие клавиши -------------------------- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;

      /**
       * «Набирает текст» — это поле ввода, а не любой input.
       *
       * Сначала здесь стояла проверка по одному тегу INPUT, и поиск
       * переставал открываться по «/», если фокус стоял на флажке или
       * переключателе конструктора: ввести туда слэш всё равно нельзя,
       * а сочетание молча переставало работать.
       */
      const type = (target as HTMLInputElement | null)?.type ?? '';
      const typing =
        !!target &&
        (target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          (target.tagName === 'INPUT' &&
            !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'file'].includes(
              type,
            )));

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement;
        setOpen((v) => !v);
        return;
      }

      // «/» — только когда человек не набирает текст в другом поле,
      // иначе слэш перестанет печататься.
      if (e.key === '/' && !typing && !open) {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement;
        setOpen(true);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ------------------------- Фокус и прокрутка -------------------------- */

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();

    // Пока открыто окно, страница за ним стоять должна на месте.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Активная строка всегда должна быть видна: список длиннее окна.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function go(entry: DocEntry) {
    close();
    router.push(entry.href);
  }

  function onPanelKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) =>
        results.length === 0 ? 0 : (i - 1 + results.length) % results.length,
      );
      return;
    }

    if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
      return;
    }

    /**
     * Удержание фокуса внутри окна.
     *
     * Без этого Tab уводит на ссылки страницы за подложкой: визуально
     * окно модальное, а для клавиатуры — нет.
     */
    if (e.key === 'Tab') {
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href]',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          opener.current = e.currentTarget;
          setOpen(true);
        }}
        className="flex w-full items-center gap-2 rounded-[10px] border border-border bg-elevated px-3 py-2 text-[13px] text-subtle transition-colors duration-200 hover:border-border-strong hover:text-muted"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        Поиск
        <kbd className="ml-auto font-mono text-[11px]">
          {mac === null ? '' : mac ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(e) => {
            // Закрываем только по клику мимо окна, а не по отпусканию
            // кнопки после выделения текста внутри него.
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Поиск по документации"
            onKeyDown={onPanelKey}
            className="animate-fade-up w-full max-w-[560px] overflow-hidden rounded-[14px] border border-border bg-elevated shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <svg
                className="shrink-0 text-subtle"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Что ищете? Например: 429, поля, водяной знак"
                aria-label="Запрос"
                role="combobox"
                aria-expanded
                aria-controls="docs-search-results"
                aria-activedescendant={
                  results[active] ? `docs-result-${active}` : undefined
                }
                className="h-12 w-full bg-transparent text-[15px] text-fg placeholder:text-subtle focus:outline-none"
              />
            </div>

            {results.length === 0 ? (
              <p className="px-4 py-8 text-center text-[14px] text-muted">
                Ничего не нашлось. Попробуйте одно слово вместо нескольких.
              </p>
            ) : (
              <ul
                id="docs-search-results"
                ref={listRef}
                role="listbox"
                className="max-h-[46vh] overflow-y-auto py-2"
              >
                {results.map((entry, i) => (
                  <li
                    key={`${entry.href}-${entry.title}`}
                    id={`docs-result-${i}`}
                    role="option"
                    aria-selected={i === active}
                  >
                    <button
                      onClick={() => go(entry)}
                      onMouseEnter={() => setActive(i)}
                      className={[
                        'flex w-full items-baseline gap-3 px-4 py-2.5 text-left transition-colors duration-150',
                        // Сплошная заливка, а не цветной текст по цветному
                        // фону: так строка читается в обеих темах и видна
                        // краем глаза при переборе стрелками.
                        i === active ? 'bg-accent' : '',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'text-[14.5px]',
                          i === active ? 'text-accent-fg' : 'text-fg',
                        ].join(' ')}
                      >
                        {entry.title}
                      </span>
                      <span
                        className={[
                          'ml-auto shrink-0 text-[12px]',
                          i === active ? 'text-accent-fg/75' : 'text-subtle',
                        ].join(' ')}
                      >
                        {entry.section}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-4 border-t border-border px-4 py-2 font-mono text-[11px] text-subtle">
              <span>↑↓ выбрать</span>
              <span>↵ перейти</span>
              <span>esc закрыть</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
