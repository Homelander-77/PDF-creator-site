import type { Metadata } from 'next';
import { OrderPlaceholder } from '@/components/order-placeholder';

export const metadata: Metadata = {
  title: 'Оплата',
  robots: { index: false, follow: false },
};

export default async function MockPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <OrderPlaceholder title="Онлайн-оплата ещё подключается" order={order ?? null}>
      <p>
        Заказ записан, но платёжный сервис пока не подключён — деньги не
        списаны, тариф не изменился.
      </p>
      <p>Когда оплата заработает, кнопка «Оплатить» будет вести на форму банка.</p>
    </OrderPlaceholder>
  );
}
