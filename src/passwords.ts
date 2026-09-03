import { hash, verify, Algorithm } from '@node-rs/argon2';

const OPTS = {
    algorithm: Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1
};

const SPECIAL_SYMBOLS: string[] = ["/", ".", ",", "?", "!", "&"];

export function hashPassword(plain: string): Promise<string> {
    return hash(plain, OPTS);
}

export async function verifyPassword(storeHash: string, plain: string): Promise<boolean> {
    try {
        return await verify(storeHash, plain);
    } catch {
        return false;
    }
}

export function validatePassword(plain: unknown): string | null {
    if (typeof plain !== 'string') return 'The password can be string.';
    if (plain.length < 10) return 'The password shorter then 10 symbols.';
    if (plain.length > 256) return 'The password longer then 256 symbols.';
    for (const symbol of SPECIAL_SYMBOLS) {
        if (plain.includes(symbol)) return null;
    }
    return 'No such special symbols';
}

