'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { useSession } from '@/hooks/use-session';
import type { Plan } from '@/lib/plans';

/**
 * Кнопка в карточке тарифа.
 *
 * Отдельный клиентский кусочек внутри серверной карточки: остальное в ней
 * статично и незачем тащить в браузер, а вот адрес кнопки зависит от того,
 * вошёл человек или нет.
 *
 * Раньше все три кнопки вели на /register — даже для того, кто уже вошёл.
 * Человек жал «Попробовать» и попадал на регистрацию, хотя аккаунт у него
 * есть. Теперь:
 *
 *   бесплатный тариф + вошёл   → в кабинет
 *   платный тариф   + вошёл    → на оплату
 *   кто угодно      + не вошёл → регистрация
 *
 * Пока ответ сервера не пришёл, показываем вариант для гостя: на лендинге
 * это подавляющее большинство, и подмена «Начать бесплатно» на «В кабинет»
 * через долю секунды выглядит спокойнее, чем наоборот.
 */
export function PlanCta({ plan, accent }: { plan: Plan; accent: boolean }) {
  const session = useSession();
  const signedIn = session.status === 'authenticated';

  const { href, label } = target(plan, signedIn);

  return (
    <Link href={href} className="block">
      <Button variant={accent ? 'primary' : 'secondary'} className="w-full">
        {label}
      </Button>
    </Link>
  );
}

function target(plan: Plan, signedIn: boolean): { href: string; label: string } {
  if (!signedIn) {
    return {
      href: '/register',
      label: plan.price === 0 ? 'Начать бесплатно' : 'Создать аккаунт',
    };
  }

  if (plan.price === 0) {
    return { href: '/dashboard', label: 'В кабинет' };
  }

  return { href: `/checkout?plan=${plan.id}`, label: 'Перейти к оплате' };
}
