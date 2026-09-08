'use client';

import { RULES, passedCount } from '@/lib/password';
import { cn } from './ui';

/**
 * Чек-лист требований вместо абстрактной «стойкости».
 *
 * Полоска «слабый / средний / надёжный» не отвечает на единственный вопрос,
 * который у человека есть: что именно добавить, чтобы приняли. Список
 * с галочками отвечает — и убирает тот класс ситуаций, где форма молча
 * не пускает дальше.
 */
export function PasswordRules({ value }: { value: string }) {
  if (value.length === 0) return null;

  const passed = passedCount(value);

  return (
    <div className="animate-fade-in mt-3">
      <div className="mb-2.5 flex gap-1">
        {RULES.map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              passed > i ? 'bg-accent' : 'bg-border',
            )}
          />
        ))}
      </div>

      <ul className="space-y-1">
        {RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.id}
              className={cn(
                'flex items-center gap-2 text-[13px] transition-colors duration-200',
                ok ? 'text-success' : 'text-subtle',
              )}
            >
              <span className="grid h-3.5 w-3.5 shrink-0 place-items-center">
                {ok ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50" />
                )}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
