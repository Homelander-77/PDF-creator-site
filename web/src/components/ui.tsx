'use client';

import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

/* --------------------------------- cn ---------------------------------- */

export const cn = (...v: Array<string | false | undefined | null>) =>
  v.filter(Boolean).join(' ');

/* ------------------------------- Reveal -------------------------------- */

/**
 * Появление при попадании в экран.
 *
 * IntersectionObserver, а не слушатель скролла: браузер сам сообщает о
 * пересечении, вне главного потока. Слушатель scroll срабатывает десятки раз
 * в секунду и на телефоне съедает те самые кадры, из-за которых «залипает».
 *
 * После первого показа наблюдение снимается — держать наблюдателя на сотне
 * элементов всю сессию незачем.
 */
/**
 * Один наблюдатель на все Reveal, а не по одному на элемент.
 *
 * На лендинге таких блоков полтора десятка. Пятнадцать отдельных
 * IntersectionObserver — это пятнадцать независимых очередей колбэков,
 * которые браузер обслуживает по отдельности. Один общий делает ту же
 * работу за один проход и отписывает элемент сразу после показа.
 */
let sharedIO: IntersectionObserver | null = null;
const pending = new Map<Element, () => void>();

function observeOnce(el: Element, onVisible: () => void) {
  if (!sharedIO) {
    sharedIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          pending.get(e.target)?.();
          pending.delete(e.target);
          sharedIO!.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
  }
  pending.set(el, onVisible);
  sharedIO.observe(el);
  return () => {
    pending.delete(el);
    sharedIO?.unobserve(el);
  };
}

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    return observeOnce(el, () => setVisible(true));
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------- Button -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'relative inline-flex items-center justify-center gap-2 font-medium ' +
    'rounded-[10px] whitespace-nowrap select-none ' +
    'transition-[transform,background-color,border-color,color,box-shadow] duration-200 ' +
    // Нажатие — только scale: трансформ, а не изменение размеров.
    'active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none ' +
    '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]';

  const variants = {
    primary:
      'bg-accent text-accent-fg hover:bg-accent-hover shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
    secondary:
      'bg-elevated text-fg border border-border hover:border-border-strong hover:bg-sunken',
    ghost: 'text-muted hover:text-fg hover:bg-accent-soft',
    danger:
      'bg-transparent text-danger border border-transparent hover:border-danger/40 hover:bg-danger/10',
  };

  const sizes = {
    sm: 'h-8 px-3 text-[13px]',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-[15px]',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="animate-spin-slow h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}

/* -------------------------------- Input -------------------------------- */

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const autoId = useRef(`in-${Math.random().toString(36).slice(2, 9)}`);
  const inputId = id ?? autoId.current;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[13px] font-medium text-muted"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-err` : undefined}
        className={cn(
          'h-11 w-full rounded-[10px] border bg-elevated px-3.5 text-[15px] text-fg',
          'placeholder:text-subtle',
          'transition-[border-color,box-shadow] duration-200',
          'focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]',
          error && 'border-danger',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${inputId}-err`} className="mt-1.5 text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

/* -------------------------------- Card --------------------------------- */

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[16px] border border-border bg-elevated',
        'transition-[transform,border-color,box-shadow] duration-300',
        '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
        hover &&
          'hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-md)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------- Badge --------------------------------- */

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  const tones = {
    neutral: 'bg-sunken text-muted border-border',
    accent: 'bg-accent-soft text-accent border-accent/25',
    success: 'bg-success/10 text-success border-success/25',
    warning: 'bg-warning/10 text-warning border-warning/25',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-medium',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------- Toast -------------------------------- */

export function Toast({
  message,
  tone = 'success',
  onDone,
}: {
  message: string;
  tone?: 'success' | 'error';
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      className={cn(
        'animate-fade-up fixed bottom-5 left-1/2 z-50 -translate-x-1/2',
        'rounded-[10px] border px-4 py-2.5 text-sm shadow-[var(--shadow-lg)]',
        tone === 'success'
          ? 'border-border bg-elevated text-fg'
          : 'border-danger/30 bg-elevated text-danger',
      )}
    >
      {message}
    </div>
  );
}

/* ------------------------------ Skeleton ------------------------------- */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[8px] bg-sunken',
        className,
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          animation: 'shimmer 1.4s infinite',
          background:
            'linear-gradient(90deg, transparent, var(--border), transparent)',
        }}
      />
    </div>
  );
}
