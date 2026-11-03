import { DiscountGrid, NewDiscountButton } from "@/components/price-list/discount-grid";
import { getProducts } from "@/lib/actions/price-list";
import { getDiscountClientCounts, getDiscounts } from "@/lib/actions/settings";

export default async function DiscountsPage() {
	const [discounts, clientCounts, memberships] = await Promise.all([
		getDiscounts(),
		getDiscountClientCounts(),
		getProducts("membership"),
	]);

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">Discounts</h1>
					<p className="text-md text-muted-foreground">Give a client a discount: it comes off every membership they buy.</p>
				</header>
				<NewDiscountButton memberships={memberships} />
			</div>

			<DiscountGrid discounts={discounts} clientCounts={clientCounts} memberships={memberships} />
		</>
	);
}
