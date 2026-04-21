
import * as dotenv from "dotenv";
import postgres from 'postgres';

dotenv.config({ path: ".env" });

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
}

const sql = postgres(process.env.DATABASE_URL);

async function main() {
    console.log("💣 Nuking Database (dropping schema public)...");
    
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    await sql`GRANT ALL ON SCHEMA public TO postgres`;
    await sql`GRANT ALL ON SCHEMA public TO public`;
    
    console.log("✅ Database reset complete.");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Reset failed:", err);
    process.exit(1);
});
