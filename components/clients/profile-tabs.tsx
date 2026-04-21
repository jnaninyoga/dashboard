"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	type Client,
	type ClientWallet,
	type MembershipProduct,
} from "@/services/database/schema";

import { HealthTab } from "./tabs/health";
import { ProfileTab } from "./tabs/profile";
import { WalletTab } from "./tabs/wallet";

interface ClientProfileTabsProps {
	client: Client & { wallets?: ClientWallet[] };
	products: MembershipProduct[];
}

export function ClientProfileTabs({
	client,
	products,
}: ClientProfileTabsProps) {
	return (
		<Tabs defaultValue="profile" className="w-full">
			<TabsList className="bg-card mb-6 grid w-full grid-cols-3 gap-2 rounded-2xl border p-1 lg:w-96">
				<TabsTrigger
					value="profile"
					className="bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
				>
					Profile
				</TabsTrigger>
				<TabsTrigger
					value="health"
					className="bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
				>
					Health
				</TabsTrigger>
				<TabsTrigger
					value="wallet"
					className="bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
				>
					Wallet
				</TabsTrigger>
			</TabsList>
			<TabsContent
				value="profile"
				className="animate-in fade-in-50 duration-300"
			>
				<ProfileTab client={client} />
			</TabsContent>
			<TabsContent
				value="health"
				className="animate-in fade-in-50 duration-300"
			>
				<HealthTab client={client} />
			</TabsContent>
			<TabsContent
				value="wallet"
				className="animate-in fade-in-50 duration-300"
			>
				<WalletTab
					clientId={client.id}
					wallets={client.wallets || []}
					products={products}
				/>
			</TabsContent>
		</Tabs>
	);
}
