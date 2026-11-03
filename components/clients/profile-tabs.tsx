"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { creditsSummary } from "@/lib/domain/clients/card";
import { expiredCards } from "@/lib/domain/clients/membership-sale";
import { type Discount } from "@/lib/types";
import { formatDay, studioDateString } from "@/lib/utils/time";
import {
	type Client,
	type ClientWallet,
	type Product,
} from "@/services/database/schema";

import { Danger } from "iconsax-reactjs";

import { HealthTab } from "./tabs/health";
import { ProfileTab } from "./tabs/profile";
import { WalletTab } from "./tabs/wallet";

interface ClientProfileTabsProps {
	client: Client & { wallets?: (ClientWallet & { product?: Product | null })[] };
	products: Product[];
	discounts?: Discount[];
	/** Open on the sale (from a refused check-in). */
	sell?: boolean;
}

const tabClass =
	"bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all";

export function ClientProfileTabs({ client, products, discounts = [], sell = false }: ClientProfileTabsProps) {
	const [tab, setTab] = useState(sell ? "wallet" : "profile");
	const [selling, setSelling] = useState(sell);
	const wallets = client.wallets ?? [];
	const today = studioDateString();
	// Their card expired with nothing else to pay: they'd be refused at the door.
	const expired = creditsSummary(wallets, today).tone === "expired" ? expiredCards(wallets, today)[0] : null;

	const startSale = () => {
		setTab("wallet");
		setSelling(true);
	};

	return (
		<div className="grid gap-6">
			{expired ? (
				<div role="alert" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-3xl border border-destructive/25 bg-destructive/5 p-4 md:p-5">
					<Danger className="size-7 shrink-0 text-destructive" variant="Bulk" />
					<div className="min-w-0 flex-1 basis-60">
						<p className="font-semibold">Card expired: not accepted at check-in</p>
						<p className="text-sm text-muted-foreground">
							{expired.product?.name ?? "Their membership"} ended on{" "}
							{formatDay(expired.expiresOn!, { day: "numeric", month: "long", year: "numeric" })} with {expired.remainingCredits}{" "}
							{expired.remainingCredits === 1 ? "credit" : "credits"} left. Sell a new membership to check them in.
						</p>
					</div>
					<Button onClick={startSale} className="h-10 rounded-xl font-semibold">
						Sell a membership
					</Button>
				</div>
			) : null}

			<Tabs value={tab} onValueChange={setTab} className="w-full">
				<TabsList className="mb-6 grid w-full grid-cols-3 gap-2 rounded-2xl border bg-card p-1 lg:w-96">
					<TabsTrigger value="profile" className={tabClass}>
						Profile
					</TabsTrigger>
					<TabsTrigger value="health" className={tabClass}>
						Health
					</TabsTrigger>
					<TabsTrigger value="wallet" className={tabClass}>
						Wallet
					</TabsTrigger>
				</TabsList>
				<TabsContent value="profile" className="animate-in duration-300 fade-in-50">
					<ProfileTab client={client} />
				</TabsContent>
				<TabsContent value="health" className="animate-in duration-300 fade-in-50">
					<HealthTab client={client} />
				</TabsContent>
				<TabsContent value="wallet" className="animate-in duration-300 fade-in-50">
					<WalletTab
						clientId={client.id}
						wallets={wallets}
						products={products}
						discounts={discounts}
						clientDiscountId={client.discountId}
						selling={selling}
						onSellingChange={setSelling}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
