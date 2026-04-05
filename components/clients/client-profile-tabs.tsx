"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Client, type ClientWallet, type MembershipProduct } from "@/drizzle/schema";

import { HealthTab } from "./tabs/health-tab";
import { ProfileTab } from "./tabs/profile-tab";
import { WalletTab } from "./tabs/wallet-tab";

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
			<TabsList className="mb-6 grid w-full grid-cols-3 lg:w-[400px]">
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="health">Health</TabsTrigger>
				<TabsTrigger value="wallet">Wallet</TabsTrigger>
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
