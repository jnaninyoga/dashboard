import { NewProductButton, ProductGrid } from "@/components/price-list/product-grid";
import { getProducts,getProductUsage } from "@/lib/actions/price-list";

export default async function PartnerRatesPage() {
	const [products, usage] = await Promise.all([
		getProducts("partner_service", { withArchived: true }),
		getProductUsage("partner_service"),
	]);

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Partner rates</h1>
					<p className="text-md text-muted-foreground">What you charge hotels and partners for a session, by group size. Pick them while you write a quotation.</p>
				</header>
				<NewProductButton kind="partner_service" />
			</div>

			<ProductGrid kind="partner_service" products={products} usage={usage} />
		</>
	);
}
