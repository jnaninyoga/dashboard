import { CreateB2BTierButton } from "@/components/b2b/tiers/create-button";
import { B2BTierList } from "@/components/b2b/tiers/list";
import { getProducts } from "@/lib/actions/price-list";

export default async function B2BSettingsPage() {
	const tiers = await getProducts("partner_service", { withArchived: true });

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						Partner rates
					</h1>
					<p className="text-md text-muted-foreground">
						Your prices for hotels and partners, offered while you write a quotation.
					</p>
				</header>
				<CreateB2BTierButton />
			</div>

			<B2BTierList initialTiers={tiers} />
		</>
	);
}
