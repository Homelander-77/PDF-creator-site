import { Redis } from 'ioredis';
import { conf } from './config.js'

export const redis = new Redis(conf.redisUrl, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
})

redis.on('error', (err: Error) => {
    console.error('[redis]', err.message);
});
