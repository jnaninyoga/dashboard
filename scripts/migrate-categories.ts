
import { db } from "@/drizzle";
import { appSettings, clientCategories, clients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
    console.log("Starting migration to Dynamic Categories...");

    // 1. Fetch existing settings for discounts
    const settings = await db.select().from(appSettings);
    const settingsMap = settings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
    }, {} as Record<string, string>);

    const studentDiscount = settingsMap["discount_student"] || "0";
    const childDiscount = settingsMap["discount_child"] || "0";

    console.log(`Found settings: Student=${studentDiscount}%, Child=${childDiscount}%`);

    // 2. Insert Default Categories
    const categories = [
        { name: "Adult", type: "percentage", value: "0" },
        { name: "Student", type: "percentage", value: studentDiscount },
        { name: "Child", type: "percentage", value: childDiscount },
    ] as const;

    const categoryMap: Record<string, string> = {};

    for (const cat of categories) {
        // Check if exists (idempotency)
        const existing = await db.query.clientCategories.findFirst({
            where: eq(clientCategories.name, cat.name)
        });

        let catId;
        if (existing) {
            console.log(`Category ${cat.name} already exists.`);
            catId = existing.id;
        } else {
            console.log(`Creating category: ${cat.name}`);
            const inserted = await db.insert(clientCategories).values({
                name: cat.name,
                discountType: "percentage",
                discountValue: cat.value,
            }).returning();
            catId = inserted[0].id;
        }
        categoryMap[cat.name.toLowerCase()] = catId;
    }

    // 3. Update Clients
    const allClients = await db.select().from(clients);
    console.log(`Migrating ${allClients.length} clients...`);

    for (const client of allClients) {
        // Map old enum string to new UUID
        // Old enum values: 'adult', 'student', 'child'
        // If undefined/null, default to adult
        const oldCat = (client as any).category || "adult"; 
        const newId = categoryMap[oldCat];

        if (newId) {
             await db.update(clients)
                .set({ categoryId: newId })
                .where(eq(clients.id, client.id));
        } else {
            console.warn(`Warning: Client ${client.id} has unknown category '${oldCat}'. defaulting to Adult.`);
             if (categoryMap['adult']) {
                await db.update(clients)
                    .set({ categoryId: categoryMap['adult'] })
                    .where(eq(clients.id, client.id));
             }
        }
    }

    console.log("Migration completed successfully.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
