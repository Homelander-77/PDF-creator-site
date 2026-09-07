'use client';

import { useTheme } from './theme';
import { cn } from './ui';

const OPTIONS = [
  { value: 'light', label: 'Светлая', icon: SunIcon },
  { value: 'system', label: 'Системная', icon: MonitorIcon },
  { value: 'dark', label: 'Тёмная', icon: MoonIcon },
] as const;

/**
 * Три состояния, а не два.
 *
 * «Системная» — не то же самое, что «светлая»: она следует за настройкой
 * телефона, который вечером сам переключается в тёмную. Тумблер на два
 * положения эту возможность отбирает.
 *
 * Подложка ездит transform'ом, а не сменой позиции — плавно и без reflow.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const index = OPTIONS.findIndex((o) => o.value === theme);

  return (
    <div
      role="radiogroup"
      aria-label="Оформление"
      className="relative inline-flex items-center rounded-full border border-border bg-elevated p-0.5"
    >
      <span
        aria-hidden
        className="absolute h-7 w-7 rounded-full bg-accent-soft transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translate3d(${index * 28}px, 0, 0)` }}
      />
      {OPTIONS.map((o) => {
        const Icon = o.icon;
        const active = theme === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.value)}
            className={cn(
              'relative z-10 grid h-7 w-7 place-items-center rounded-full',
              'transition-colors duration-200',
              active ? 'text-accent' : 'text-subtle hover:text-fg',
            )}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
