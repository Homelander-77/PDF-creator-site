import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * Заголовок и запрет на индексацию для страницы «Регистрация».
 *
 * Сама страница помечена 'use client' — ей нужны состояние и обработчики.
 * Клиентский компонент не может экспортировать metadata: его код исполняется
 * в браузере, а заголовок нужен серверу в момент отдачи HTML. Поэтому рядом
 * лежит вот такой серверный layout — он ничего не рисует, только сообщает
 * Next, как назвать страницу.
 *
 * robots.index = false: содержимого для поиска здесь нет, а то же самое написано на главной — незачем плодить в выдаче две похожие страницы.
 */
export const metadata: Metadata = {
  title: 'Регистрация',
  description: 'Создание аккаунта pdfapi: 100 страниц в месяц бесплатно.',
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
