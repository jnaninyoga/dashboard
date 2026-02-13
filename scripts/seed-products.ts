
import "dotenv/config";
import { db } from "../drizzle";
import { membershipProducts } from "../drizzle/schema";

async function main() {
	console.log("Seeding membership products...");

	const products = [
		{
			name: "Pass Découverte (1)",
			defaultCredits: 1,
			basePrice: "100.00",
		},
		{
			name: "Carte 5 Cours",
			defaultCredits: 5,
			basePrice: "400.00",
		},
		{
			name: "Carte 10 Cours",
			defaultCredits: 10,
			basePrice: "700.00",
		},
		{
			name: "Pass Illimité (1 Mois)",
			defaultCredits: 30, // Approx for unlimited? Or special handling? User said "30 Credits (approx)"
			basePrice: "600.00",
		},
	];

	for (const product of products) {
		await db.insert(membershipProducts).values(product);
		console.log(`Inserted: ${product.name}`);
	}

	console.log("Done!");
	process.exit(0);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
