import pg from 'pg';
import { conf } from './config.js'

export const pool = new pg.Pool({
    connectionString: conf.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
): Promise<pg.QueryResult> {
    return pool.query<T>(text, params as never)
}
