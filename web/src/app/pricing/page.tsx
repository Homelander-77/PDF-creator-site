import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PricingCalculator } from '@/components/pricing-calculator';
import { Button, Reveal } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Тарифы',
  description:
    'Тарифы pdfapi: 100 страниц в месяц бесплатно, дальше от 1 990 ₽. Калькулятор объёма и сравнение со своим сервером.',
  alternates: { canonical: '/pricing' },
};

const FAQ = [
  {
    q: 'Что считается страницей?',
    a: 'Страница готового PDF. Документ на сорок страниц стоит сорок, независимо от того, одним запросом он собран или сорока. Запросы мы не считаем вообще — считать их значит наказывать за аккуратный код.',
  },
  {
    q: 'Что будет, когда лимит закончится?',
    a: 'Следующий запрос вернёт 402 и понятное сообщение с числами: сколько израсходовано и сколько было. Начатый документ при этом не обрывается на середине — страница резервируется до рендера, а точный расход становится известен только по готовому файлу.',
  },
  {
    q: 'Неизрасходованные страницы переносятся на следующий месяц?',
    a: 'Нет, в конце периода счётчик обнуляется. Поэтому тариф стоит брать по обычному объёму, а не по самому пиковому месяцу в году.',
  },
  {
    q: 'Чем бесплатный тариф отличается, кроме объёма?',
    a: 'Водяным знаком на страницах и одним источником — HTML. URL, Markdown и Office-документы доступны с Premium. Ключ можно выпустить один, скорость — один запрос в секунду.',
  },
  {
    q: 'Лимит скорости считается на аккаунт или на ключ?',
    a: 'На ключ. Поэтому шумный стейджинг не отнимает скорость у продакшена — при условии, что у них разные ключи. Ради этого ключи и делаются отдельными под каждое окружение.',
  },
];

export default function PricingPage() {
  return (
    <>
      <Header />

      <main className="page-enter">
        <section className="mx-auto max-w-6xl px-5 pb-8 pt-14 sm:pt-20">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-3 font-mono text-[13px] text-accent">Тарифы</div>
              <h1 className="text-balance text-[32px] font-semibold leading-tight tracking-[-0.03em] sm:text-[44px]">
                Платите за страницы, а не за запросы
              </h1>
              <p className="mt-4 text-[17px] leading-relaxed text-muted">
                Подвиньте ползунок — увидите свой тариф и честное сравнение
                с тем, во сколько обошлась бы своя установка.
              </p>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <PricingCalculator />
        </section>

        {/* ------------------------------ FAQ ---------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-5 py-20">
            <Reveal>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[32px]">
                Частые вопросы
              </h2>
            </Reveal>

            <div className="mt-8 divide-y divide-border border-y border-border">
              {FAQ.map((item, i) => (
                <Reveal key={item.q} delay={i * 50}>
                  {/*
                    details/summary, а не своё состояние: раскрытие работает
                    без единой строки JavaScript, ищется поиском по странице
                    и правильно читается экранными дикторами.
                  */}
                  <details className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-medium marker:content-none">
                      {item.q}
                      <svg
                        className="shrink-0 text-subtle transition-transform duration-300 group-open:rotate-45"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        aria-hidden
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </summary>
                    <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-muted">
                      {item.a}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ CTA ---------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <Reveal>
              <h2 className="text-[26px] font-semibold tracking-[-0.02em] sm:text-[34px]">
                Сто страниц, чтобы проверить на своих документах
              </h2>
              <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-muted">
                Без карты и без разговора с менеджером. Не подойдёт — просто
                не вернётесь.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg">Создать аккаунт</Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="ghost">
                    Сначала документация
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
