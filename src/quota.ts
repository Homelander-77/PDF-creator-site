import type { Plan } from './plans.js';
import { currentPeriod } from './plans.js';

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

export async function getUsage(userId, plan: Plan): Promise<QuotaResult> {

}

export async function checkRate(keyId: string, plan: Plan, cost = 1): Promise<RateResult> {
    return { allowed: true, remaining: plan.burst, retryAfterMs: 0 };
}
