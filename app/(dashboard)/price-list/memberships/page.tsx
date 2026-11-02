import { NewProductButton, ProductGrid } from "@/components/price-list/product-grid";
import { getProducts,getProductUsage } from "@/lib/actions/price-list";

export default async function MembershipsPage() {
	const [products, usage] = await Promise.all([
		getProducts("membership", { withArchived: true }),
		getProductUsage("membership"),
	]);

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">Memberships</h1>
					<p className="text-md text-muted-foreground">The cards you sell to clients: a credit for each visit, for a number of months.</p>
				</header>
				<NewProductButton kind="membership" />
			</div>

			<ProductGrid kind="membership" products={products} usage={usage} />
		</>
	);
}
