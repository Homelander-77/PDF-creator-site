import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { DashboardChrome } from '@/components/dashboard-chrome';

/**
 * Серверная обёртка кабинета.
 *
 * Сам кабинет живёт в браузере: сессия, выход, переходы. Но заголовок
 * страницы нужен серверу в момент отдачи HTML, а клиентский компонент
 * экспортировать metadata не умеет. Поэтому layout разделён надвое: здесь
 * заголовок, в DashboardChrome — всё остальное.
 *
 * index: false на всякий случай. Содержимое кабинета и так за авторизацией,
 * поисковик его не увидит, но пустую страницу с заголовком в выдачу
 * утащить может.
 */
export const metadata: Metadata = {
  title: 'Ключи',
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardChrome>{children}</DashboardChrome>;
}
