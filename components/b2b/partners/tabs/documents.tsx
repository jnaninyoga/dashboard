"use client";

import Link from "next/link";

import { DocumentList } from "@/components/b2b/documents/list";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import { Document } from "iconsax-reactjs";

interface DocumentsTabProps {
	partner: PartnerWithRelations;
}

export function DocumentsTab({ partner }: DocumentsTabProps) {
	return (
		<TabsContent
			value="documents"
			className="animate-in fade-in slide-in-from-bottom-2 space-y-6 duration-500"
		>
			<div className="flex items-center justify-between px-2">
				<div className="flex items-center gap-2">
					<Document size={24} variant="Bulk" className="text-primary" />
					<h2 className="font-heading text-xl font-bold">Documents</h2>
				</div>
				<Link href={`/b2b/documents/new?partner=${partner.id}`}>
					<Button
						size="sm"
						className="zen-glow-teal h-9 gap-2 rounded-xl text-xs font-bold"
					>
						<Document size={16} className="mr-1" variant="Outline" />
						New Quotation
					</Button>
				</Link>
			</div>
			<DocumentList
				documents={partner.documents || []}
				partnerId={partner.id}
			/>
		</TabsContent>
	);
}
