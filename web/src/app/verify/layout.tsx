import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Заголовок и запрет на индексацию для страницы «Подтверждение почты».
 *
 * Сама страница помечена 'use client' — ей нужны состояние и обработчики.
 * Клиентский компонент не может экспортировать metadata: его код исполняется
 * в браузере, а заголовок нужен серверу в момент отдачи HTML. Поэтому рядом
 * лежит вот такой серверный layout — он ничего не рисует, только сообщает
 * Next, как назвать страницу.
 *
 * robots.index = false: содержимого для поиска здесь нет, а в адресе приходит одноразовый токен, ему в поиске делать нечего.
 */
export const metadata: Metadata = {
  title: 'Подтверждение почты',
  description: 'Подтверждение адреса почты pdfapi.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
