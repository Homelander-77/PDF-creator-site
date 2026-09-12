import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Заголовок и запрет на индексацию для страницы «Восстановление пароля».
 *
 * Сама страница помечена 'use client' — ей нужны состояние и обработчики.
 * Клиентский компонент не может экспортировать metadata: его код исполняется
 * в браузере, а заголовок нужен серверу в момент отдачи HTML. Поэтому рядом
 * лежит вот такой серверный layout — он ничего не рисует, только сообщает
 * Next, как назвать страницу.
 *
 * robots.index = false: содержимого для поиска здесь нет, а страница восстановления в поиске только сбивает с толку.
 */
export const metadata: Metadata = {
  title: 'Восстановление пароля',
  description: 'Ссылка для восстановления пароля pdfapi.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
