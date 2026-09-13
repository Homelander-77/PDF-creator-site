'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Card, Input } from '@/components/ui';
import { PlanCards } from '@/components/plan-cards';
import { MAX_PLAN_PAGES, kop, num, planFor, rub } from '@/lib/plans';

/**
 * Остановки ползунка.
 *
 * Шкала неравномерная: от сотни до полумиллиона страниц разница в пять
 * тысяч раз, и на равномерной шкале весь интересный участок — первые
 * десять пикселей. Поэтому не формула, а готовый список круглых значений:
 * человек получает понятные числа вместо 13 947 страниц, а ползунок ходит
 * ровными шагами.
 */
const STOPS = [
  100, 200, 300, 500, 750,
  1_000, 1_500, 2_000, 3_000, 5_000, 7_500,
  10_000, 15_000, 20_000, 30_000, 50_000, 75_000,
  100_000, 150_000, 200_000, 300_000, 500_000,
];

const DEFAULT_INDEX = STOPS.indexOf(10_000);

/** Вводные для сравнения со своим сервером. Это предположения, не факты. */
const DEFAULTS = { server: 3000, hours: 4, rate: 2500 };

export function PricingCalculator() {
  const [index, setIndex] = useState(DEFAULT_INDEX);
  const [server, setServer] = useState(DEFAULTS.server);
  const [hours, setHours] = useState(DEFAULTS.hours);
  const [rate, setRate] = useState(DEFAULTS.rate);

  const pages = STOPS[index];
  const plan = useMemo(() => planFor(pages), [pages]);

  const selfHost = server + hours * rate;
  const ours = plan?.price ?? null;

  const pagesRef = useCountUp(pages);
  const priceRef = useCountUp(ours ?? 0);

  return (
    <div className="space-y-8">
      {/* --------------------------- Ползунок --------------------------- */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <label
              htmlFor="volume"
              className="text-[13px] font-medium text-muted"
            >
              Сколько страниц в месяц вам нужно
            </label>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                ref={pagesRef}
                className="text-[38px] font-semibold tracking-[-0.03em] tabular-nums sm:text-[46px]"
              >
                {num(pages)}
              </span>
              <span className="text-[16px] text-muted">страниц</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[13px] font-medium text-muted">
              {plan ? `Тариф ${plan.name}` : 'Индивидуальный расчёт'}
            </div>
            <div className="mt-1 flex items-baseline justify-end gap-1">
              {plan ? (
                <>
                  <span
                    ref={priceRef}
                    className="text-[38px] font-semibold tracking-[-0.03em] tabular-nums text-accent sm:text-[46px]"
                  >
                    {num(plan.price)}
                  </span>
                  <span className="text-[16px] text-muted">₽ в месяц</span>
                </>
              ) : (
                <span className="text-[22px] font-medium text-muted">
                  больше {num(MAX_PLAN_PAGES)} страниц
                </span>
              )}
            </div>
          </div>
        </div>

        <input
          id="volume"
          type="range"
          min={0}
          max={STOPS.length - 1}
          step={1}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          /**
           * Экранный диктор иначе прочитает «одиннадцать из двадцати
           * одного» — то есть номер деления, который ничего не значит.
           */
          aria-valuetext={`${num(pages)} страниц в месяц`}
          /**
           * Пройденная часть дорожки закрашивается фирменным цветом.
           * Родного способа сделать это нет — только заливка градиентом
           * с резкой границей ровно в точке, где стоит бегунок.
           */
          style={{
            background: `linear-gradient(to right, var(--accent) ${
              (index / (STOPS.length - 1)) * 100
            }%, var(--bg-sunken) ${(index / (STOPS.length - 1)) * 100}%)`,
          }}
          className={[
            'mt-7 h-2 w-full cursor-pointer appearance-none rounded-full',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg)]',
            '[&::-webkit-slider-thumb]:bg-accent',
            '[&::-webkit-slider-thumb]:shadow-[var(--shadow-md)]',
            '[&::-webkit-slider-thumb]:transition-transform',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2',
            '[&::-moz-range-thumb]:border-[var(--bg)] [&::-moz-range-thumb]:bg-accent',
          ].join(' ')}
        />

        <div className="mt-2 flex justify-between font-mono text-[12px] text-subtle">
          <span>{num(STOPS[0])}</span>
          <span>{num(STOPS[STOPS.length - 1])}</span>
        </div>

        {plan && plan.price > 0 && (
          <p className="mt-5 text-[14px] text-muted">
            {kop(plan.price / plan.pages)} за страницу. В тариф входит{' '}
            {num(plan.pages)} страниц — запас на всплески у вас есть.
          </p>
        )}

        {plan && plan.price === 0 && (
          <p className="mt-5 text-[14px] text-muted">
            Столько отдаётся бесплатно. Карта не нужна, ограничение одно —
            водяной знак на страницах.
          </p>
        )}

        {!plan && (
          <p className="mt-5 text-[14px] text-muted">
            Больше {num(MAX_PLAN_PAGES)} страниц в месяц — это уже отдельный
            разговор про выделенные мощности и цену за страницу ниже
            тарифной. Напишите нам, посчитаем под ваш объём.
          </p>
        )}
      </Card>

      {/* --------------------------- Карточки --------------------------- */}
      <PlanCards highlight={plan?.id ?? null} />

      {/* ------------------------ Свой сервер --------------------------- */}
      <Card className="p-6 sm:p-8">
        <h3 className="text-[20px] font-medium tracking-tight">
          А если поставить Chromium самому?
        </h3>
        <p className="mt-2 max-w-[64ch] text-[15px] leading-relaxed text-muted">
          Честный вопрос, и ответ не всегда в нашу пользу. Подставьте свои
          числа — значения ниже это предположения, а не факты.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Money
            label="Сервер, ₽ в месяц"
            value={server}
            onChange={setServer}
            hint="4 ядра, 8 ГБ — Chromium прожорлив"
          />
          <Money
            label="Часов на обслуживание"
            value={hours}
            onChange={setHours}
            hint="обновления, упавшие шрифты, память"
          />
          <Money
            label="Ставка часа, ₽"
            value={rate}
            onChange={setRate}
            hint="сколько стоит час разработчика"
          />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Figure title="Свой сервер" value={rub(selfHost)}>
            {rub(server)} за железо
            {hours > 0 && <> и {rub(hours * rate)} за {num(hours)} ч работы</>}
          </Figure>

          <Figure
            title={plan ? `pdfapi, тариф ${plan.name}` : 'pdfapi'}
            value={ours === null ? 'по договорённости' : rub(ours)}
            accent
          >
            {ours === null
              ? 'объём выше тарифной сетки'
              : ours === 0
                ? 'бесплатно, платить не за что'
                : `${num(pages)} страниц укладываются в тариф`}
          </Figure>
        </div>

        <Verdict
          pages={pages}
          ours={ours}
          selfHost={selfHost}
          server={server}
          rate={rate}
        />
      </Card>
    </div>
  );
}

/* ------------------------------- Вывод --------------------------------- */

function Verdict({
  pages,
  ours,
  selfHost,
  server,
  rate,
}: {
  pages: number;
  ours: number | null;
  selfHost: number;
  server: number;
  rate: number;
}) {
  if (ours === null) {
    return (
      <Note>
        На таких объёмах считать надо руками: и у нас, и у вас цена упирается
        уже не в тариф, а в количество машин.
      </Note>
    );
  }

  if (ours === 0) {
    return (
      <Note tone="good">
        Ваш объём укладывается в бесплатный тариф. Сравнивать нечего: свой
        сервер стоит {rub(selfHost)} в месяц, а этот вариант — ноль.
      </Note>
    );
  }

  const diff = selfHost - ours;

  /**
   * Сколько часов обслуживания в месяц уравнивает расходы.
   *
   * Может выйти отрицательным — это не ошибка: значит, один только сервер,
   * вообще без человека, уже дороже тарифа, и точки равновесия нет.
   */
  const breakEven = rate > 0 ? (ours - server) / rate : 0;
  const hoursText = `${breakEven.toFixed(1).replace('.', ',')} ч в месяц`;

  if (diff === 0) {
    return (
      <Note>
        Ровно поровну: {rub(ours)} и там, и там. Дальше решают вещи, которые
        в деньгах не считаются, — кому держать это в голове и что делать,
        когда рендер ляжет в субботу.
      </Note>
    );
  }

  if (diff > 0) {
    return (
      <Note tone="good">
        При ваших вводных pdfapi дешевле на {rub(diff)} в месяц.{' '}
        {breakEven > 0 ? (
          <>
            Но держится это на оценке времени: если обслуживание займёт меньше{' '}
            {hoursText}, выгоднее станет свой сервер. Поставьте своё число
            часов и посмотрите.
          </>
        ) : (
          <>
            Причём ваше время тут даже не учитывается: один только сервер за{' '}
            {rub(server)} уже дороже тарифа.
          </>
        )}
      </Note>
    );
  }

  return (
    <Note>
      При ваших вводных свой сервер дешевле на {rub(-diff)} в месяц — и это
      нормальный ответ. На {num(pages)} страниц в месяц своя установка
      окупается, если есть кому её обслуживать. Мы начинаем выигрывать, когда
      обслуживание отнимает больше {hoursText} — или когда объём растёт
      скачками и сервер приходится брать с запасом.
    </Note>
  );
}

function Note({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'good';
}) {
  return (
    <p
      className={[
        'mt-6 rounded-[12px] border px-4 py-3.5 text-[14.5px] leading-relaxed',
        tone === 'good'
          ? 'border-success/25 bg-success/8 text-success'
          : 'border-border bg-sunken text-muted',
      ].join(' ')}
    >
      {children}
    </p>
  );
}

function Figure({
  title,
  value,
  children,
  accent,
}: {
  title: string;
  value: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-sunken p-5">
      <div className="text-[13px] text-muted">{title}</div>
      <div
        className={[
          'mt-1 text-[26px] font-semibold tracking-[-0.02em] tabular-nums',
          accent ? 'text-accent' : '',
        ].join(' ')}
      >
        {value}
      </div>
      <div className="mt-1 text-[13px] text-subtle">{children}</div>
    </div>
  );
}

function Money({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint: string;
}) {
  return (
    <Input
      label={label}
      hint={hint}
      type="number"
      min={0}
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const next = Number(e.target.value);
        // Пустое поле даёт NaN, минус — отрицательные расходы.
        onChange(Number.isFinite(next) && next >= 0 ? next : 0);
      }}
    />
  );
}

/* ------------------------------ Счётчик -------------------------------- */

/**
 * Плавный счёт до нового значения.
 *
 * Пишем прямо в DOM через requestAnimationFrame, а не через состояние:
 * иначе каждый кадр анимации — это перерисовка всего калькулятора,
 * шестьдесят раз в секунду. Здесь же меняется одна текстовая нода.
 */
function useCountUp(target: number) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(target);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from = current.current;
    if (from === target) return;

    // Уважение к системной настройке: кому анимации мешают, тот получает
    // сразу конечное значение.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still) {
      current.current = target;
      el.textContent = format(target);
      return;
    }

    const DURATION = 420;
    let start: number | null = null;
    let raf = 0;

    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      // Замедление к концу: движение выглядит как остановка, а не как обрыв.
      const eased = 1 - Math.pow(1 - p, 3);
      const value = from + (target - from) * eased;

      el.textContent = format(value);
      current.current = value;

      if (p < 1) raf = requestAnimationFrame(tick);
      else current.current = target;
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return ref;
}

function format(value: number): string {
  return num(value);
}
