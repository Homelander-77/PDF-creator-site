import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Checkout } from '@/components/checkout';
import { Skeleton } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Оплата',
  description: 'Выбор способа оплаты тарифа pdfapi.',
  // Страница привязана к конкретному аккаунту и тарифу в адресе —
  // в поиске ей делать нечего.
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <>
      <Header />

      <main className="page-enter mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <div className="mb-8">
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] sm:text-[34px]">
            Оплата тарифа
          </h1>
          <p className="mt-2 text-[15.5px] leading-relaxed text-muted">
            Списание раз в месяц, отменить можно в любой момент. Неиспользованные
            страницы на следующий период не переносятся.
          </p>
        </div>

        {/*
          useSearchParams внутри требует границы Suspense: без неё Next
          отказывается собирать страницу статически и ругается при сборке.
        */}
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Checkout />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
