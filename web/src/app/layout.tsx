import type { Metadata, Viewport } from 'next';
import { ThemeProvider, themeScript } from '@/components/theme';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'pdfapi — HTML в PDF одним запросом',
    template: '%s · pdfapi',
  },
  description:
    'API для генерации PDF из HTML, Markdown и Office-документов. Без своего Chromium, шрифтов и утечек памяти.',
  openGraph: {
    title: 'pdfapi — HTML в PDF одним запросом',
    description:
      'API для генерации PDF из HTML, Markdown и Office-документов.',
    type: 'website',
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
