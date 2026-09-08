'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from './ui';

const SNIPPET = `curl -X POST https://api.pdfapi.dev/v1/convert \\
  -H "Authorization: Bearer pdf_live_..." \\
  -d '{"source":"html","html":"<h1>Счёт №42</h1>"}' \\
  -o invoice.pdf`;

/**
 * Геро-демо: набирается команда, затем «проявляется» страница PDF.
 *
 * Три решения ради плавности на слабых устройствах:
 *  1. Набор текста — срез строки по таймеру. Никаких DOM-манипуляций
 *     на символ, React перерисовывает один текстовый узел.
 *  2. Появление страницы — opacity и translate3d. Ни один кадр не трогает
 *     раскладку.
 *  3. Анимация не стартует, пока блок не виден, и полностью отключается
 *     при prefers-reduced-motion — тогда сразу показывается финальный кадр.
 */
const CHARS_PER_SEC = 58;

export function HeroDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const code = codeRef.current;
    if (!el || !code) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      code.textContent = SNIPPET;
      setDone(true);
      return;
    }

    let raf = 0;
    let startedAt = 0;
    let stopped = false;

    /**
     * Набор через requestAnimationFrame и прямую запись в DOM.
     *
     * Раньше здесь был setTimeout с setState на каждый символ: полторы сотни
     * перерисовок React подряд, каждая со своим согласованием дерева. Плюс
     * интервал 14–36 мс не попадал в кадр — символы появлялись то по два,
     * то ни одного. Отсюда и рваность.
     *
     * Теперь кадр задаёт браузер, а количество символов считается от
     * прошедшего времени. Если кадр пропущен, следующий догонит — темп
     * остаётся ровным на любом устройстве. React перерисовывается один раз,
     * в самом конце.
     */
    const tick = (t: number) => {
      if (stopped) return;
      if (!startedAt) startedAt = t;

      const n = Math.min(
        SNIPPET.length,
        Math.floor(((t - startedAt) / 1000) * CHARS_PER_SEC),
      );

      if (code.textContent!.length !== n) {
        code.textContent = SNIPPET.slice(0, n);
      }

      if (n < SNIPPET.length) raf = requestAnimationFrame(tick);
      else setDone(true);
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          raf = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.25 },
    );

    io.observe(el);
    return () => {
      stopped = true;
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="grid gap-4 sm:grid-cols-[1.25fr_1fr] sm:gap-5">
      {/* Терминал */}
      <div className="overflow-hidden rounded-[16px] border border-border bg-sunken shadow-[var(--shadow-md)]">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 font-mono text-[12px] text-subtle">bash</span>
        </div>
        <pre className="min-h-[150px] overflow-x-auto p-4 text-[12.5px] leading-[1.75] sm:min-h-[168px]">
          {/* Содержимое пишется напрямую через ref — React сюда не заглядывает. */}
          <code ref={codeRef} className={cn('font-mono text-fg', !done && 'caret')} />
        </pre>
      </div>

      {/* Результат */}
      <div
        className={cn(
          'relative overflow-hidden rounded-[16px] border border-border bg-elevated p-5',
          'transition-[opacity,transform] duration-700 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
          done
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0',
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[12px] text-subtle">invoice.pdf</span>
          <span className="rounded-full border border-success/25 bg-success/10 px-2 py-0.5 font-mono text-[11px] text-success">
            200 · 1 стр.
          </span>
        </div>

        {/* Схематичная страница: прямоугольники вместо картинки —
            ничего не грузится по сети и масштабируется без потерь. */}
        <div className="rounded-[8px] border border-border bg-bg p-4">
          <div className="mb-3 h-3 w-2/3 rounded bg-fg/80" />
          <div className="space-y-1.5">
            {[100, 92, 78, 96, 60].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded bg-fg/12"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
          <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
            <div className="h-1.5 w-16 rounded bg-fg/12" />
            <div className="h-3 w-20 rounded bg-accent/70" />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          готово за 340 мс
        </div>
      </div>
    </div>
  );
}
