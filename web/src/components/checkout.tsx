'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Skeleton } from '@/components/ui';
import { useSession } from '@/hooks/use-session';
import { ApiError, api, type PaymentMethod } from '@/lib/api';
import { PLANS, kop, num, pricePerPage, rub } from '@/lib/plans';

/**
 * Выбор способа оплаты.
 *
 * Здесь НЕТ полей для номера карты — и не будет. Карту принимает форма
 * платёжного провайдера, мы только создаём платёж и уходим на его адрес.
 * Принимать реквизиты у себя означает подпадать под PCI DSS со всем, что
 * к нему прилагается, ради ровно нулевой выгоды для человека: форма
 * провайдера ему привычнее нашей.
 */

const METHODS: Array<{
  id: PaymentMethod;
  title: string;
  text: string;
  icon: string;
}> = [
  {
    id: 'card',
    title: 'Банковская карта',
    text: 'Спишется автоматически каждый месяц. Отменить можно в кабинете.',
    icon: 'M2 7h20M2 11h20M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  },
  {
    id: 'sbp',
    title: 'СБП',
    text: 'Оплата из приложения банка по QR-коду. Разовый платёж за месяц.',
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
  },
  {
    id: 'invoice',
    title: 'Счёт для юрлица',
    text: 'Пришлём счёт и закрывающие документы. Оплата по безналу.',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  },
];

export function Checkout() {
  const router = useRouter();
  const params = useSearchParams();
  const session = useSession();

  const [method, setMethod] = useState<PaymentMethod>('card');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = useMemo(
    () => PLANS.find((p) => p.id === params.get('plan')) ?? null,
    [params],
  );

  /* ----------------------- Чего здесь быть не должно ------------------- */

  if (plan === null || plan.price === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-[20px] font-medium">Тариф не выбран</h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-[15px] leading-relaxed text-muted">
          Похоже, адрес открыт напрямую. Выберите тариф на странице цен —
          там же есть калькулятор объёма.
        </p>
        <div className="mt-6">
          <Link href="/pricing">
            <Button>К тарифам</Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Пока сессия не подтверждена — скелет. Показывать форму оплаты тому,
  // кто не вошёл, значит вести его в тупик на последнем шаге.
  if (session.status === 'loading') {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (session.status === 'anonymous') {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-[20px] font-medium">Сначала войдите</h2>
        <p className="mx-auto mt-2 max-w-[46ch] text-[15px] leading-relaxed text-muted">
          Тариф привязывается к аккаунту, поэтому оплата возможна только
          после входа. Если аккаунта ещё нет — регистрация занимает минуту.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`/login?next=/checkout?plan=${plan.id}`}>
            <Button>Войти</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Создать аккаунт</Button>
          </Link>
        </div>
      </Card>
    );
  }

  /* ------------------------------ Оплата ------------------------------- */

  async function pay() {
    if (!plan) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.checkout(plan.id, method);
      const next = result.payment_url ?? result.invoice_url;

      if (!next) {
        setError('Сервер не вернул адрес оплаты.');
        setSending(false);
        return;
      }

      // Уходим на форму провайдера. Именно assign, а не router.push:
      // это чужой домен, внутренняя навигация Next туда не умеет.
      window.location.assign(next);
    } catch (err) {
      /**
       * Пока ручки оплаты на сервере нет, приходит 404 — и общее «что-то
       * пошло не так» тут только злит. Говорим прямо, в чём дело.
       */
      if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
        setError('Оплата ещё подключается. Напишите нам — выставим счёт вручную.');
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Не удалось создать платёж.',
        );
      }
      setSending(false);
    }
  }

  const current = session.session.plan;
  const already = current === plan.id;

  return (
    <div className="space-y-6">
      {/* ----------------------------- Тариф ---------------------------- */}
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[13px] text-muted">Тариф</div>
            <div className="mt-1 text-[26px] font-semibold tracking-[-0.02em]">
              {plan.name}
            </div>
            <div className="mt-1 text-[14px] text-muted">
              {num(plan.pages)} страниц в месяц · {kop(pricePerPage(plan))} за
              страницу
            </div>
          </div>
          <div className="text-right">
            <div className="text-[13px] text-muted">К оплате</div>
            <div className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-accent">
              {rub(plan.price)}
            </div>
            <div className="mt-1 text-[13px] text-subtle">в месяц</div>
          </div>
        </div>

        {already && (
          <p className="mt-5 rounded-[10px] border border-success/25 bg-success/8 px-4 py-3 text-[14px] text-success">
            Этот тариф у вас уже активен. Повторная оплата продлит его на
            месяц вперёд.
          </p>
        )}
      </Card>

      {/* ---------------------------- Способ ---------------------------- */}
      <Card className="p-6">
        <h2 className="mb-4 text-[17px] font-medium">Как платим</h2>

        <fieldset className="space-y-2">
          <legend className="sr-only">Способ оплаты</legend>
          {METHODS.map((m) => (
            <label
              key={m.id}
              className={[
                'flex cursor-pointer items-start gap-3 rounded-[12px] border p-4 transition-colors duration-200',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                method === m.id
                  ? 'border-accent bg-accent-soft'
                  : 'border-border hover:border-border-strong',
              ].join(' ')}
            >
              <input
                type="radio"
                name="method"
                value={m.id}
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="sr-only"
              />
              <span
                className={[
                  'mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[9px]',
                  method === m.id ? 'bg-accent text-accent-fg' : 'bg-sunken text-muted',
                ].join(' ')}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={m.icon} />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-medium">{m.title}</span>
                <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">
                  {m.text}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <div
            role="alert"
            className="animate-fade-in mt-4 rounded-[10px] border border-danger/25 bg-danger/8 px-3.5 py-2.5 text-[14px] text-danger"
          >
            {error}
          </div>
        )}

        <Button
          size="lg"
          loading={sending}
          onClick={pay}
          className="mt-5 w-full"
        >
          {method === 'invoice'
            ? 'Выставить счёт'
            : `Оплатить ${rub(plan.price)}`}
        </Button>

        <p className="mt-3 text-center text-[12.5px] leading-relaxed text-subtle">
          Данные карты вводятся на стороне платёжного сервиса — на наш сервер
          они не попадают.
        </p>
      </Card>

      <p className="text-center text-[13.5px] text-muted">
        Передумали?{' '}
        <button
          onClick={() => router.back()}
          className="text-accent underline decoration-accent/40 underline-offset-2 transition-colors hover:decoration-accent"
        >
          Вернуться назад
        </button>
      </p>
    </div>
  );
}
