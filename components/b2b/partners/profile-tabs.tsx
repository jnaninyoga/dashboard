"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import { ContactsTab } from "./tabs/contacts";
import { DocumentsTab } from "./tabs/documents";

interface ProfileTabsProps {
	partner: PartnerWithRelations;
}

export function ProfileTabs({ partner }: ProfileTabsProps) {
	return (
		<Tabs defaultValue="documents" className="w-full">
			<TabsList className="mb-6 grid w-full grid-cols-2 gap-2 rounded-2xl border bg-card p-1 lg:w-80">
				<TabsTrigger
					value="documents"
					className="data-[state=active]:zen-glow-blush rounded-xl bg-background px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
				>
					Documents
				</TabsTrigger>
				<TabsTrigger
					value="contacts"
					className="data-[state=active]:zen-glow-blush rounded-xl bg-background px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
				>
					Contacts
				</TabsTrigger>
			</TabsList>
			
			<ContactsTab partner={partner} />
			<DocumentsTab partner={partner} />
		</Tabs>
	);
}
