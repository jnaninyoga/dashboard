
import "dotenv/config";

import { db } from "@/services/database";
import { products } from "@/services/database/schema";

async function main() {
	console.log("Seeding membership products...");

	const memberships = [
		{
			name: "Pass Découverte (1)",
			credits: 1,
			price: "100.00",
		},
		{
			name: "Carte 5 Cours",
			credits: 5,
			price: "400.00",
		},
		{
			name: "Carte 10 Cours",
			credits: 10,
			price: "700.00",
		},
		{
			name: "Pass Illimité (1 Mois)",
			credits: 30, // Approx for unlimited? Or special handling? User said "30 Credits (approx)"
			price: "600.00",
		},
	];

	for (const product of memberships) {
		await db.insert(products).values({ kind: "membership", ...product });
		console.log(`Inserted: ${product.name}`);
	}

	console.log("Done!");
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
