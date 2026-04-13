"use client";

import { ContactDialog } from "@/components/b2b/contacts/dialog";
import { ContactList } from "@/components/b2b/contacts/list";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import { UserAdd } from "iconsax-reactjs";

interface ContactsTabProps {
	partner: PartnerWithRelations;
}

export function ContactsTab({ partner }: ContactsTabProps) {
	return (
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
	);
}
