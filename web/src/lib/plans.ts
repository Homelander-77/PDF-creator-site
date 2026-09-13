/**
 * Тарифы — один источник правды на весь сайт.
 *
 * Раньше этот список лежал прямо в лендинге. Теперь его читают и лендинг,
 * и страница тарифов, и калькулятор: три копии одних и тех же цифр рано или
 * поздно разъезжаются, и замечает это клиент, а не мы.
 */

export type PlanId = 'free' | 'premium' | 'business';

export type Plan = {
  id: PlanId;
  name: string;
  /** Рублей в месяц. Число, а не строка: калькулятор на нём считает. */
  price: number;
  /** Сколько страниц входит в тариф. */
  pages: number;
  /** Запросов в секунду и допустимый всплеск сверх этого. */
  rps: number;
  burst: number;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
};

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    pages: 100,
    rps: 1,
    burst: 3,
    features: [
      'HTML в PDF',
      'Водяной знак на страницах',
      'Один ключ',
      'Без карты',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 1990,
    pages: 10_000,
    rps: 10,
    burst: 30,
    features: [
      'HTML, URL, Markdown, Office',
      'Без водяного знака',
      'Ключи под каждое окружение',
      'Webhooks',
    ],
    cta: 'Попробовать',
    href: '/register',
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 7990,
    pages: 100_000,
    rps: 50,
    burst: 150,
    features: [
      'Всё из Premium',
      'Приоритетная очередь',
      'SLA 99,9%',
      'Ответ поддержки за рабочий день',
    ],
    cta: 'Попробовать',
    href: '/register',
    popular: false,
  },
];

export const MAX_PLAN_PAGES = PLANS[PLANS.length - 1].pages;

/** Самый дешёвый тариф, в который влезает такой объём. */
export function planFor(pages: number): Plan | null {
  return PLANS.find((p) => pages <= p.pages) ?? null;
}

/**
 * Форматирование чисел — своё, а не toLocaleString.
 *
 * toLocaleString в Node и в браузере ставит разные пробелы-разделители
 * (обычный неразрывный против узкого). Страница собирается на сервере, а
 * потом оживает в браузере — и React жалуется на расхождение разметки.
 * Свой формат даёт одинаковый результат на обеих сторонах.
 */
export function num(value: number): string {
  const whole = Math.round(value).toString();
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function rub(value: number): string {
  return `${num(value)} ₽`;
}

/** Цена одной страницы — аргумент «чем больше объём, тем дешевле». */
export function pricePerPage(plan: Plan): number {
  return plan.price / plan.pages;
}

/**
 * Копейки. Отдельная функция, потому что num() округляет до рублей —
 * страница стоит меньше рубля, и там округление превратило бы её в ноль.
 */
export function kop(value: number): string {
  return `${value.toFixed(2).replace('.', ',')} ₽`;
}
