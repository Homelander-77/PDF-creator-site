import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Заголовок и запрет на индексацию для страницы «Вход».
 *
 * Сама страница помечена 'use client' — ей нужны состояние и обработчики.
 * Клиентский компонент не может экспортировать metadata: его код исполняется
 * в браузере, а заголовок нужен серверу в момент отдачи HTML. Поэтому рядом
 * лежит вот такой серверный layout — он ничего не рисует, только сообщает
 * Next, как назвать страницу.
 *
 * robots.index = false: содержимого для поиска здесь нет, а форма входа в выдаче никому не помогает.
 */
export const metadata: Metadata = {
  title: 'Вход',
  description: 'Вход в кабинет pdfapi.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
