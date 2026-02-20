
import { db } from "@/drizzle";
import { clientCategories } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("🌱 Seeding Client Categories...");

    // Default Categories with no initial discounts (can be configured later)
    // Or we can set defaults if we want.
    const categories = [
        { name: "Adult", type: "percentage", value: "0" },
        { name: "Student", type: "percentage", value: "20" }, // Sensible default
        { name: "Child", type: "percentage", value: "0" },
    ] as const;

    for (const cat of categories) {
        // Check if exists (idempotency)
        const existing = await db.query.clientCategories.findFirst({
            where: eq(clientCategories.name, cat.name)
        });

        if (existing) {
            console.log(`Category ${cat.name} already exists.`);
        } else {
            console.log(`Creating category: ${cat.name}`);
            await db.insert(clientCategories).values({
                name: cat.name,
                discountType: "percentage",
                discountValue: cat.value,
            });
        }
    }

    console.log("✅ Categories seeded successfully.");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
