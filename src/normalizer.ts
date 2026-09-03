const emailRegex: RegExp = /^(?=.{3,255})[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function normalizeEmail(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;
    const email = raw.trim().toLowerCase();
    if (!emailRegex.test(email)) return null;
    return email;
}
