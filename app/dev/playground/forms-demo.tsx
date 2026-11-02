"use client";

import { useState } from "react";

import { ContactDialog } from "@/components/b2b/contacts/dialog";
import { PartnerDialog } from "@/components/b2b/partners/dialog";
import { ClientForm } from "@/components/clients/form";
import { HealthTab } from "@/components/clients/tabs/health";
import { WalletTab } from "@/components/clients/tabs/wallet";
import { DiscountSheet } from "@/components/price-list/discount-sheet";
import { NewProductButton } from "@/components/price-list/product-grid";
import { ProductSheet } from "@/components/price-list/product-sheet";
import { NewSessionDialog } from "@/components/schedule/sessions/new-dialog";
import { Button } from "@/components/ui/button";

// The real create/edit forms, so their sheets can be checked without signing
// in. Saves go to whatever DATABASE_URL the dev server uses (.env.local).
const demoClient = {
	id: "00000000-0000-0000-0000-000000000000",
	healthLogs: [],
	intakeData: {},
} as unknown as React.ComponentProps<typeof HealthTab>["client"];

export function FormsDemo() {
	const [tierOpen, setTierOpen] = useState(false);
	const [categoryOpen, setCategoryOpen] = useState(false);
	const [sessionOpen, setSessionOpen] = useState(false);
	const [clientFormShown, setClientFormShown] = useState(false);

	return (
		<section className="bg-card grid gap-4 rounded-3xl border p-6">
			<h2 className="text-xl">Forms</h2>
			<div className="flex flex-wrap gap-3">
				<PartnerDialog>
					<Button variant="outline">Partner</Button>
				</PartnerDialog>
				<ContactDialog partnerId={demoClient.id}>
					<Button variant="outline">Contact</Button>
				</ContactDialog>
				<Button variant="outline" onClick={() => setTierOpen(true)}>
					Partner rate
				</Button>
				<Button variant="outline" onClick={() => setCategoryOpen(true)}>
					Discount
				</Button>
				<NewProductButton kind="membership" />
				<Button variant="outline" onClick={() => setSessionOpen(true)}>
					Session
				</Button>
				<Button variant="outline" onClick={() => setClientFormShown((shown) => !shown)}>
					Client form
				</Button>
			</div>
			{clientFormShown ? (
				<div data-testid="client-form">
					<ClientForm mode="create" discounts={[]} />
				</div>
			) : null}
			<ProductSheet kind="partner_service" open={tierOpen} onOpenChange={setTierOpen} />
			<DiscountSheet memberships={[]} open={categoryOpen} onOpenChange={setCategoryOpen} />
			<NewSessionDialog open={sessionOpen} onOpenChange={setSessionOpen} />
			<div data-testid="wallet-tab">
				<WalletTab clientId={demoClient.id} wallets={[]} products={[]} />
			</div>
			<div data-testid="health-tab">
				<HealthTab client={demoClient} />
			</div>
		</section>
	);
}
