export interface Plan {
    id: string;
    pagesPerMonth: number;
    ratePerSecond: number;
    burst: number;
}

export const PLANS: Record<string, Plan> = {
    free: { id: 'free', pagesPerMonth: 100, ratePerSecond: 1, burst: 3 },
    premium: { id: 'premium', pagesPerMonth: 10_000, ratePerSecond: 10, burst: 30 },
};

export const getPlan = (id: string): Plan => PLANS[id] ?? PLANS.free;

export function currentPeriod(now = new Date()): string {
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function secondsUntilPeriodEnd(now = new Date()): number {
    const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    return Math.max(60, Math.ceil((next - now.getTime()) / 1000))
}
