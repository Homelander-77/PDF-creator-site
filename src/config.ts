export const conf = {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? '0.0.0.0',
    databaseUrl:
        process.env.DATABASE_URL ?? 'postgres://pdfapi:pdfapi@localhost:5432/pdfapi',
    redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    keyPrefix: process.env.KEY_PREFIX ?? 'pdf_live_',
    keyCacheTtl: Number(process.env.KEY_CACHE_TTL ?? 60),
    adminToken: process.env.ADMIN_TOKEN ?? '',
    verifyTokenTtl: Number(process.env.VERIFY_TOKEN_TTL ?? 24 * 3600),
    sessionTtl: Number(process.env.SESSION_TTL ?? 30 * 24 * 3600),
    cookieName: process.env.COOKIE_NAME ?? 'sid',
    isProd: process.env.NODE_ENV === 'production',
    appUrl: process.env.APPURL ?? 'http://localhost:3001',
    resetTokenTtl: Number(process.env.RESETTOKENTTL ?? 3600)
};
