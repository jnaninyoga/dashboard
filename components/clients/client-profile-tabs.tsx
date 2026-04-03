"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./tabs/profile-tab";
import { HealthTab } from "./tabs/health-tab";
import { WalletTab } from "./tabs/wallet-tab";

interface ClientProfileTabsProps {
	client: any; // TODO: Strict typing
	products: any[];
}

export function ClientProfileTabs({
	client,
	products,
}: ClientProfileTabsProps) {
	return (
		<Tabs defaultValue="profile" className="w-full">
			<TabsList className="grid w-full grid-cols-3 lg:w-[400px] mb-6">
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
