/**
 * Адрес сайта — одно место на весь проект.
 *
 * Он нужен там, где относительной ссылки мало: картинка для превью в
 * мессенджерах, canonical, sitemap. Телеграм не умеет открыть «/og.png» —
 * ему нужен полный адрес вместе с доменом.
 *
 * Пока домена нет, работаем на localhost. Когда появится — добавить в
 * web/.env.local строку
 *
 *     NEXT_PUBLIC_SITE_URL=https://ваш-домен
 *
 * и пересобрать. Больше ничего править не придётся.
 *
 * Хвостовой слэш срезаем: иначе new URL() и шаблоны ссылок начнут плодить
 * адреса вида «https://сайт//og.png».
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export const SITE_NAME = 'pdfapi';

/**
 * Страницы, которые попадают в поиск.
 *
 * Отсюда же собирается sitemap, поэтому список один, а не два: забыть
 * дописать страницу в sitemap проще всего именно тогда, когда он живёт
 * отдельным файлом со своим перечнем.
 *
 * Кабинета, входа и всего, что связано с письмами, здесь нет намеренно —
 * см. robots.ts.
 */
export const PUBLIC_ROUTES = [
  { path: '/', priority: 1, changeFrequency: 'weekly' as const },
  { path: '/docs', priority: 0.8, changeFrequency: 'weekly' as const },
];
