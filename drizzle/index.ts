import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

// Singleton pattern for Next.js hot reloading
const globalForDb = globalThis as unknown as {
	conn: ReturnType<typeof postgres> | undefined;
};

// Disable prefetch as it is not supported for "Transaction" pool mode
const client =
	globalForDb.conn ?? postgres(process.env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") globalForDb.conn = client;

export const db = drizzle(client, { schema });