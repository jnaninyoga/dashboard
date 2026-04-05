import { getB2BPricingTiers } from "@/actions/settings";
import { B2BTierList } from "@/components/settings/b2b-tier-list";
import { CreateB2BTierButton } from "@/components/settings/create-b2b-tier-button";

export default async function B2BSettingsPage() {
	const tiers = await getB2BPricingTiers();

	return (
		<>
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<header className="space-y-1">
					<h1 className="font-heading text-foreground text-3xl font-medium tracking-tight md:text-4xl">
						B2B Pricing Engine
					</h1>
					<p className="text-md text-muted-foreground">
						Configure dynamic pricing tiers for Couples, Families, and Groups.
					</p>
				</header>
				<CreateB2BTierButton />
			</div>

			<B2BTierList initialTiers={tiers} />
		</>
	);
}
