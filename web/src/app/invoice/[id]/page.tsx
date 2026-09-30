import type { Metadata } from 'next';
import { OrderPlaceholder } from '@/components/order-placeholder';

export const metadata: Metadata = {
  title: 'Счёт на оплату',
  robots: { index: false, follow: false },
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <OrderPlaceholder title="Счёт готовится" order={id}>
      <p>
        Заказ на оплату по счёту записан. Выставление счетов для юрлиц пока
        подключается — сам счёт с реквизитами здесь появится позже.
      </p>
      <p>Тариф изменится после поступления оплаты.</p>
    </OrderPlaceholder>
  );
}
