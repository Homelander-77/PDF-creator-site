import { Badge, Card, Reveal } from '@/components/ui';
import { PlanCta } from '@/components/plan-cta';
import { PLANS, kop, num, pricePerPage, type PlanId } from '@/lib/plans';

/**
 * Свой маленький cn вместо общего из ui.tsx.
 *
 * ui.tsx помечен 'use client', и всё, что оттуда импортируется, Next считает
 * клиентским — включая обычную функцию склейки классов. Лендинг же
 * серверный, и на попытке вызвать её при сборке страница падает. Три строки
 * здесь дешевле, чем тащить ui.tsx на сервер.
 */
const cn = (...v: Array<string | false | undefined | null>) =>
  v.filter(Boolean).join(' ');

/**
 * Карточки тарифов.
 *
 * Один компонент на лендинг и на страницу тарифов. На странице тарифов
 * калькулятор передаёт highlight — тариф, в который человек попадает по
 * своему объёму, и карточка подсвечивается.
 */
export function PlanCards({ highlight }: { highlight?: PlanId | null }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLANS.map((p, i) => {
        const chosen = highlight === p.id;

        return (
          <Reveal key={p.id} delay={i * 70}>
            <Card
              hover
              className={cn(
                'relative h-full p-6',
                // Подсветка «вам сюда» важнее пометки «популярный»:
                // человек только что сам назвал свой объём.
                chosen
                  ? 'border-accent shadow-[var(--shadow-md)] ring-1 ring-accent'
                  : p.popular
                    ? 'border-accent/40 shadow-[var(--shadow-md)]'
                    : '',
              )}
            >
              {(chosen || p.popular) && (
                <div className="absolute -top-3 left-6">
                  <Badge tone="accent">
                    {chosen ? 'Ваш объём' : 'Популярный'}
                  </Badge>
                </div>
              )}

              <div className="mb-1 text-[15px] font-medium">{p.name}</div>

              <div className="mb-1 flex items-baseline gap-1">
                <span className="text-[40px] font-semibold tracking-[-0.03em]">
                  {num(p.price)}
                </span>
                <span className="text-[15px] text-muted">
                  ₽{p.price > 0 && ' в месяц'}
                </span>
              </div>

              <div className="mb-6 text-[14px] text-muted">
                {num(p.pages)} страниц в месяц
              </div>

              <PlanCta plan={p} accent={chosen || p.popular} />

              <ul className="mt-6 space-y-2.5">
                <li className="flex items-start gap-2.5 text-[14px] text-muted">
                  <Tick />
                  {p.rps} запрос{plural(p.rps)} в секунду, всплеск до {p.burst}
                </li>
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[14px] text-muted"
                  >
                    <Tick />
                    {f}
                  </li>
                ))}
              </ul>

              {p.price > 0 && (
                <p className="mt-5 border-t border-border pt-4 text-[13px] text-subtle">
                  Это {kop(pricePerPage(p))} за страницу
                </p>
              )}
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}

function plural(n: number): string {
  const last = n % 10;
  const teen = n % 100 >= 11 && n % 100 <= 14;
  if (!teen && last === 1) return '';
  if (!teen && last >= 2 && last <= 4) return 'а';
  return 'ов';
}

function Tick() {
  return (
    <svg
      className="mt-[3px] shrink-0 text-accent"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
