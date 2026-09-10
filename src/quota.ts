import type { Plan } from './plans.js';
import { currentPeriod } from './plans.js';

const mem = new Map<string, number>();

export interface QuotaResult {
    allowed: boolean;
    used: number;
    limit: number;
    remaining: number;
};

export interface RateResult {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
}

export const quotaKey = (userId: string, period = currentPeriod()) => `quota:${userId}:${period}`;

export async function reservePages(userId: string, plan: Plan, cost = 1): Promise<QuotaResult> {

}

export async function adjustPages(userId: string, delta: number): Promise<void> {

}

export async function getUsage(userId: string, plan: Plan): Promise<QuotaResult> {
    const used = mem.get(quotaKey(userId)) ?? 0;
    return {
        allowed: used < plan.pagesPerMonth,
        used,
        limit: plan.pagesPerMonth,
        remaining: Math.max(0, plan.pagesPerMonth - used),
    };
}

export async function checkRate(keyId: string, plan: Plan, cost = 1): Promise<RateResult> {
    return { allowed: true, remaining: plan.burst, retryAfterMs: 0 };
}
