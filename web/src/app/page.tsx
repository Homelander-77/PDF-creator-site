import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { HeroDemo } from '@/components/hero-demo';
import { CodeBlock } from '@/components/code-block';
import { Badge, Button, Card, Reveal } from '@/components/ui';

const FEATURES = [
  {
    title: 'Без своего Chromium',
    text: 'Не нужно держать headless-браузер, следить за его памятью и чинить шрифты в контейнере. Это наша забота.',
    icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20z',
  },
  {
    title: 'Честные страницы',
    text: 'Списываем реальные страницы готового документа, а не запросы. Заголовок X-Pages-Rendered в каждом ответе.',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6',
  },
  {
    title: 'Предсказуемая скорость',
    text: 'Очередь и token bucket на нашей стороне. Всплеск в тысячу документов не уронит ни вас, ни соседей.',
    icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  },
  {
    title: 'Изоляция и SSRF-фильтр',
    text: 'Рендер живёт во внутренней сети без доступа наружу. Ссылки резолвятся и проверяются до запроса.',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  },
  {
    title: 'HTML, Markdown, Office',
    text: 'docx, xlsx и pptx конвертируются через LibreOffice тем же одним эндпоинтом.',
    icon: 'M4 4h16v16H4zM4 9h16M9 4v16',
  },
  {
    title: 'Ключи, которые можно отозвать',
    text: 'Отдельный ключ на прод, стейджинг и локалку. Утёк — гасится мгновенно, остальные продолжают работать.',
    icon: 'M21 2l-2 2m-7.6 7.6a5 5 0 1 1-7-7 5 5 0 0 1 7 7zM15 7l4 4M18 4l4 4',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Заведите ключ',
    text: 'Регистрация по почте, подтверждение, ключ в кабинете. Минута.',
    code: `curl -X POST https://api.pdfapi.dev/v1/keys \\
  -H "Authorization: Bearer pdf_live_..." \\
  -d '{"name":"production"}'`,
  },
  {
    n: '02',
    title: 'Отправьте документ',
    text: 'HTML, ссылку или Markdown. Настройки полей и ориентации — по желанию.',
    code: `const res = await fetch('https://api.pdfapi.dev/v1/convert', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + process.env.PDF_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ source: 'html', html }),
});`,
  },
  {
    n: '03',
    title: 'Получите PDF',
    text: 'Бинарный ответ и заголовки с остатком квоты — без второго запроса.',
    code: `const pdf = Buffer.from(await res.arrayBuffer());
res.headers.get('X-Pages-Rendered');   // 7
res.headers.get('X-Quota-Remaining');  // 9931`,
  },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '0',
    period: '',
    pages: '100 страниц в месяц',
    features: [
      'HTML в PDF',
      '1 запрос в секунду',
      'Водяной знак',
      'Один ключ',
    ],
    cta: 'Начать бесплатно',
    href: '/register',
    accent: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '25',
    period: '$ в месяц',
    pages: '10 000 страниц в месяц',
    features: [
      'HTML, URL, Markdown, Office',
      '10 запросов в секунду',
      'Без водяного знака',
      'Ключи под каждое окружение',
      'Webhooks',
    ],
    cta: 'Попробовать',
    href: '/register',
    accent: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '99',
    period: '$ в месяц',
    pages: '100 000 страниц в месяц',
    features: [
      'Всё из Premium',
      '50 запросов в секунду',
      'Приоритетная очередь',
      'SLA 99,9%',
      'Поддержка в один рабочий день',
    ],
    cta: 'Связаться',
    href: '/register',
    accent: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />

      <main>
        {/* ------------------------------ Hero ---------------------------- */}
        <section className="relative overflow-hidden">
          <div className="aurora" aria-hidden />
          <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />

          <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
            <div className="stagger mx-auto max-w-3xl text-center">
              <Badge tone="accent">Gotenberg под капотом · без вашего Chromium</Badge>

              <h1 className="mt-5 text-balance text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[60px]">
                HTML в PDF
                <br />
                <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
                  одним запросом
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted sm:text-[19px]">
                Поднимать headless-браузер в продакшене — это память, шрифты,
                кодировки и утечки. Отдайте это нам: один POST, на выходе PDF.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Начать бесплатно
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    Документация
                  </Button>
                </Link>
              </div>

              <p className="mt-4 font-mono text-[12.5px] text-subtle">
                100 страниц в месяц бесплатно · без карты
              </p>
            </div>

            <div className="mx-auto mt-14 max-w-4xl">
              <HeroDemo />
            </div>
          </div>
        </section>

        {/* ---------------------------- Features -------------------------- */}
        <section id="features" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Reveal>
              <div className="max-w-2xl">
                <div className="mb-3 font-mono text-[13px] text-accent">
                  Возможности
                </div>
                <h2 className="text-balance text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">
                  Всё скучное уже сделано
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">
                  Каждый пункт ниже — это неделя, которую вы не потратите
                  на инфраструктуру рендеринга.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 60}>
                  <Card hover className="h-full p-6">
                    <span className="mb-4 inline-grid h-10 w-10 place-items-center rounded-[10px] bg-accent-soft text-accent">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={f.icon} />
                      </svg>
                    </span>
                    <h3 className="mb-2 font-medium tracking-tight">{f.title}</h3>
                    <p className="text-[14.5px] leading-relaxed text-muted">
                      {f.text}
                    </p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ Steps --------------------------- */}
        <section className="border-t border-border bg-sunken/50">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Reveal>
              <div className="mb-12 max-w-2xl">
                <div className="mb-3 font-mono text-[13px] text-accent">
                  Как это работает
                </div>
                <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">
                  Три шага до первого PDF
                </h2>
              </div>
            </Reveal>

            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <Reveal key={s.n} delay={i * 80}>
                  <div className="grid items-center gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <div>
                      <div className="mb-3 font-mono text-[13px] text-subtle">
                        {s.n}
                      </div>
                      <h3 className="mb-2 text-[21px] font-medium tracking-tight">
                        {s.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed text-muted">
                        {s.text}
                      </p>
                    </div>
                    <CodeBlock code={s.code} lang={i === 0 ? 'bash' : 'javascript'} />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------- Pricing -------------------------- */}
        <section id="pricing" className="scroll-mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <div className="mb-3 font-mono text-[13px] text-accent">Тарифы</div>
                <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.02em] sm:text-[40px]">
                  Платите за страницы, а не за запросы
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-muted">
                  Документ на сорок страниц честно стоит сорок страниц.
                  Никаких «условных единиц».
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {PLANS.map((p, i) => (
                <Reveal key={p.id} delay={i * 70}>
                  <Card
                    hover
                    className={cnPlan(p.accent)}
                  >
                    {p.accent && (
                      <div className="absolute -top-3 left-6">
                        <Badge tone="accent">Популярный</Badge>
                      </div>
                    )}

                    <div className="mb-1 text-[15px] font-medium">{p.name}</div>
                    <div className="mb-1 flex items-baseline gap-1">
                      <span className="text-[40px] font-semibold tracking-[-0.03em]">
                        {p.price}
                      </span>
                      <span className="text-[15px] text-muted">
                        {p.period || '₽'}
                      </span>
                    </div>
                    <div className="mb-6 text-[14px] text-muted">{p.pages}</div>

                    <Link href={p.href} className="block">
                      <Button
                        variant={p.accent ? 'primary' : 'secondary'}
                        className="w-full"
                      >
                        {p.cta}
                      </Button>
                    </Link>

                    <ul className="mt-6 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[14px] text-muted">
                          <svg
                            className="mt-[3px] shrink-0 text-accent"
                            width="14" height="14" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- CTA ---------------------------- */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
            <Reveal>
              <div className="relative overflow-hidden rounded-[24px] border border-border bg-elevated px-6 py-14 text-center sm:px-14">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-40 blur-3xl"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, var(--accent), transparent 70%)',
                  }}
                />
                <h2 className="text-balance text-[28px] font-semibold leading-tight tracking-[-0.02em] sm:text-[38px]">
                  Первый PDF — через пять минут
                </h2>
                <p className="mx-auto mt-4 max-w-[46ch] text-[16px] leading-relaxed text-muted">
                  Сто страниц в месяц бесплатно, карта не нужна.
                  Хватит, чтобы проверить на своих документах.
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
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function cnPlan(accent: boolean) {
  return [
    'relative h-full p-6',
    accent ? 'border-accent/40 shadow-[var(--shadow-md)]' : '',
  ]
    .filter(Boolean)
    .join(' ');
}
