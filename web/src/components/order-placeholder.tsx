import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Card, ButtonLink } from '@/components/ui';

/**
 * Куда сервер отправляет после «Оплатить», пока платёжный сервис не
 * подключён.
 *
 * Бэкенд уже создаёт заказ и возвращает адрес — сейчас это наша же
 * страница, а не форма провайдера. Без неё человек после нажатия кнопки
 * попадал на 404 и решал, что деньги ушли в никуда. Здесь честно
 * говорим, что произошло: заказ записан, денег не списано, тариф не
 * изменился.
 */
export function OrderPlaceholder({
  title,
  order,
  children,
}: {
  title: string;
  order: string | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="page-enter mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <Card className="p-8 text-center">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em]">{title}</h1>
          {order && (
            <p className="mt-2 font-mono text-[13px] text-subtle">
              заказ {order.slice(0, 8)}
            </p>
          )}
          <div className="mx-auto mt-4 max-w-[48ch] space-y-3 text-[15px] leading-relaxed text-muted">
            {children}
          </div>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/dashboard">В кабинет</ButtonLink>
            <ButtonLink href="/pricing" variant="secondary">К тарифам</ButtonLink>
          </div>
        </Card>
      </main>
      <Footer />
    </>
  );
}
