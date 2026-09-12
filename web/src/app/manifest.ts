import type { MetadataRoute } from 'next';

/**
 * Манифест — то, что читает телефон, когда сайт добавляют на домашний экран.
 *
 * Без него ярлык получает обрезанный скриншот вместо иконки и открывается
 * в браузере со всей его обвязкой. Файл маленький, а разница заметная.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'pdfapi — HTML в PDF одним запросом',
    short_name: 'pdfapi',
    description:
      'API для генерации PDF из HTML, Markdown и Office-документов.',
    lang: 'ru',
    start_url: '/',
    display: 'standalone',
    background_color: '#fcfcfd',
    theme_color: '#fcfcfd',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // maskable — версия, из которой система сама вырежет свою форму:
      // круг, квадрат со скруглением, каплю. Поэтому она без скруглений и
      // без прозрачных углов, иначе по краям вылезает пустота.
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
