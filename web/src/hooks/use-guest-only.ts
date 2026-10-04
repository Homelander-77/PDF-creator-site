'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';

/**
 * Страница только для тех, кто не вошёл: вход, регистрация, «забыли пароль».
 *
 * Раньше вошедший человек мог открыть /register и заполнить форму заново —
 * получал «проверьте почту», хотя аккаунт у него есть и он в нём сидит.
 * Теперь такого сразу отправляем туда, куда он и шёл.
 *
 * Пока ответ сервера не пришёл, форма показывается как обычно: на этих
 * страницах почти все — гости, и прятать форму на полсекунды ради редкого
 * случая значило бы заставить моргать страницу у всех.
 */
export function useGuestOnly(target = '/dashboard') {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session.status === 'authenticated') router.replace(target);
  }, [session.status, router, target]);
}
