import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

import { conf } from '../config.js';
import { render } from '../render/index.js';
import type { RenderJobData, RenderJobResult } from './types.js';

const connection = new Redis(conf.redisUrl, {maxRetriesPerRequest: null,});

connection.on('error', (err: Error) => {console.error('[render-worker-redis]', err.message);});

export const renderWorker = new Worker<RenderJobData, RenderJobResult>(
    'render',
    async (job) => {
        console.log(`[render-worker] active ${job.id} priority=${job.opts.priority}`,);
        const result = await render(job.data.input);
        return {
          pdfBase64: result.pdf.toString('base64'),
          pages: result.pages,
          ms: result.ms,
        };
    },
    {
        connection,
        concurrency: 2,
    },
);

renderWorker.on('completed', (job) => {console.log(`[render-worker] completed ${job.id}`);});

renderWorker.on('failed', (job, err) => {console.error(`[render-worker] failed ${job?.id}: ${err.message}`);});
