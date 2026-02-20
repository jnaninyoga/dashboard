
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
    console.log("💣 Nuking Database (dropping schema public)...");
    
    await client`DROP SCHEMA IF EXISTS public CASCADE`;
    await client`CREATE SCHEMA public`;
    await client`GRANT ALL ON SCHEMA public TO postgres`;
    await client`GRANT ALL ON SCHEMA public TO public`;
    
    console.log("✅ Database reset complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});
