import { RenderError } from './errors.js';

function parseDurationMs(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount)) {
    return null;
  }
  return unit === 's' ? amount * 1000 : amount;
}

export function validateWaitDelay(waitDelay?: string): void {
  if (waitDelay === undefined) {
    return;
  }
  const ms = parseDurationMs(waitDelay);
  if (ms === null || ms > 10_000) {
    throw new RenderError('render_failed');
  }
}
