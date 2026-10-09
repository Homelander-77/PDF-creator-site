import { Queue, QueueEvents } from 'bullmq';
import { Redis } from 'ioredis';

import { conf } from '../config.js';
import { RenderError } from '../render/errors.js';
import type { RenderInput, RenderResult } from '../render/index.js';
import type { RenderJobData, RenderJobResult } from './types.js';

const queueConnection = new Redis(conf.redisUrl, {
    maxRetriesPerRequest: null,
});

const eventsConnection = new Redis(conf.redisUrl, {
    maxRetriesPerRequest: null,
});

queueConnection.on('error', (err: Error) => {
    console.error('[render-queue-redis]', err.message);
});

eventsConnection.on('error', (err: Error) => {
    console.error('[render-events-redis]', err.message);
});

export const renderQueue = new Queue<RenderJobData, RenderJobResult>(
    'render',
    {
        connection: queueConnection,
        defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 100,
            attempts: 1,
        },
    },
);

export const renderQueueEvents = new QueueEvents('render', {
    connection: eventsConnection,
});

export function priorityForPlan(planId: string): number {
    if (planId === 'business') return 1;
    if (planId === 'premium') return 2;
    return 3;
}

const RENDER_ERRORS = new Set([
    'url_not_allowed',
    'render_failed',
    'render_timeout',
    'unavailable',
]);

export async function renderThroughQueue(
    input: RenderInput,
    planId: string,
): Promise<RenderResult> {
    const counts = await renderQueue.getJobCounts('waiting', 'prioritized');
    const queued = (counts.waiting ?? 0) + (counts.prioritized ?? 0);
    if (queued >= conf.renderQueueMax) {
      throw new RenderError('unavailable')
    }
    const job = await renderQueue.add(
        'render-pdf',
        { input },
        {
            priority: priorityForPlan(planId),
        },
    );

    try {
        const result = await job.waitUntilFinished(renderQueueEvents, 35_000);
        return {
          pdf: Buffer.from(result.pdfBase64, 'base64'),
          pages: result.pages,
          ms: result.ms,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        if (RENDER_ERRORS.has(message)) {
            throw new RenderError(
                message as 'url_not_allowed' |
                'render_failed' |
                'render_timeout' |
                'unavailable',
            );
        }

        throw err;
    }
}
