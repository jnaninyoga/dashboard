"use client";

import { ContactDialog } from "@/components/b2b/contact-dialog";
import { ContactList } from "@/components/b2b/contact-list";
import { DocumentDialog } from "@/components/b2b/document-dialog";
import { DocumentList } from "@/components/b2b/document-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import {
	Document,
	InfoCircle,
	Location,
	MoneyRecive,
	UserAdd,
} from "iconsax-reactjs";

interface PartnerProfileTabsProps {
	partner: PartnerWithRelations;
}

export function PartnerProfileTabs({ partner }: PartnerProfileTabsProps) {
	return (
		<Tabs defaultValue="documents" className="w-full">
			<TabsList className="bg-card border-foreground/10 mb-6 grid w-full grid-cols-2 gap-2 rounded-2xl border p-1 lg:w-80">
				<TabsTrigger
					value="documents"
					className="bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
				>
					Documents
				</TabsTrigger>
				<TabsTrigger
					value="contacts"
					className="bg-background data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground data-[state=active]:zen-glow-blush rounded-xl px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all"
				>
					Contacts
				</TabsTrigger>
			</TabsList>

			{/* Contacts Tab */}
			<TabsContent
				value="contacts"
				className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500"
			>
				<div className="flex items-center justify-between px-2">
					<div className="flex items-center gap-2">
						<UserAdd size={24} variant="Bulk" className="text-primary" />
						<h2 className="font-heading text-xl font-bold">Partner Contacts</h2>
					</div>
					<ContactDialog partnerId={partner.id}>
						<Button
							size="sm"
							className="zen-glow-teal h-9 gap-2 rounded-xl text-xs font-bold"
						>
							<UserAdd className="mr-1 h-4 w-4" variant="Outline" />
							New Contact
						</Button>
					</ContactDialog>
				</div>
				<ContactList contacts={partner.contacts || []} />
			</TabsContent>

			{/* Documents Tab */}
			<TabsContent
				value="documents"
				className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500"
			>
				<div className="flex items-center justify-between px-2">
					<div className="flex items-center gap-2">
						<Document size={24} variant="Bulk" className="text-primary" />
						<h2 className="font-heading text-xl font-bold">Documents</h2>
					</div>
					<DocumentDialog
						partnerId={partner.id}
						contacts={partner.contacts || []}
					>
						<Button
							size="sm"
							className="zen-glow-teal h-9 gap-2 rounded-xl text-xs font-bold"
						>
							<Document size={16} className="mr-1" variant="Outline" />
							New Document
						</Button>
					</DocumentDialog>
				</div>
				<DocumentList
					documents={partner.documents || []}
					partnerId={partner.id}
					contacts={partner.contacts || []}
				/>
			</TabsContent>
		</Tabs>
	);
}
