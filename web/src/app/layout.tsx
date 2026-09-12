import type { Metadata, Viewport } from 'next';
import { ThemeProvider, themeScript } from '@/components/theme';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const TITLE = 'pdfapi — HTML в PDF одним запросом';
const DESCRIPTION =
  'API для генерации PDF из HTML, Markdown и Office-документов. Без своего Chromium, шрифтов и утечек памяти.';

export const metadata: Metadata = {
  /**
   * Без metadataBase Next не умеет превратить «/og.png» в полный адрес,
   * и мессенджеры молча показывают ссылку без картинки. Ошибки при этом
   * нет нигде — просто превью не появляется, и понять почему тяжело.
   */
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: '%s · pdfapi',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,

  /**
   * canonical здесь намеренно НЕ задан.
   *
   * Всё, что стоит в корневом layout, наследуется каждой страницей. Один
   * canonical на всех означал бы «настоящий адрес у нас только один, это
   * главная» — и документация просто выпала бы из поиска. Каждая
   * индексируемая страница указывает свой адрес сама.
   */

  icons: {
    // SVG — основной: одна картинка на любой размер и плотность экрана.
    // .ico оставлен для старых браузеров и для тех, кто по привычке
    // запрашивает /favicon.ico напрямую, минуя разметку.
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    apple: '/apple-touch-icon.png',
  },

  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    locale: 'ru_RU',
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'pdfapi — HTML в PDF одним запросом',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Цвет строки состояния под каждую тему — иначе на телефоне сверху
  // остаётся белая полоса поверх тёмной страницы.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fcfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0d' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Ставит тему до первой отрисовки — иначе страница мигнёт светлой. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
