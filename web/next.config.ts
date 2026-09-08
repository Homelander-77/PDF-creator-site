import type { NextConfig } from 'next';

const API = process.env.API_ORIGIN ?? 'http://localhost:3001';

const config: NextConfig = {
  reactStrictMode: true,

  /**
   * Прокси на Fastify.
   *
   * Браузер ходит только на localhost:3000, а Next переписывает /api/* на ваш
   * бэкенд. Так всё выглядит одним источником — не нужен CORS, и сессионная
   * кука с SameSite=Lax отправляется без плясок. В проде здесь будет либо
   * тот же rewrite на внутренний адрес, либо nginx перед обоими сервисами.
   */
  async rewrites() {
    return [
      { source: '/api/auth/:path*', destination: `${API}/auth/:path*` },
      // Маршруты кабинета: та же работа, что /v1/*, но по сессионной куке.
      { source: '/api/account/:path*', destination: `${API}/account/:path*` },
      { source: '/api/v1/:path*', destination: `${API}/v1/:path*` },
      { source: '/api/health', destination: `${API}/health` },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default config;
