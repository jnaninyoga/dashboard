"use client";

import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EntityCard, EntityCardFigures, EntityCardGrid, EntityCardHeader, Figure } from "@/components/entity-card";
import { type PartnerWithRelations } from "@/lib/types";

import { Buildings, Call, DocumentText } from "iconsax-reactjs";

import { CopyableTaxId } from "../copyable-tax-id";

import { PartnerActions } from "./actions";

/**
 * Partners in the dashboard's card language (EntityCard), like the client
 * cards: who they are, the figures, and the next step (call the main
 * contact, start a quotation).
 */
export function PartnerGrid({ partners }: { partners: PartnerWithRelations[] }) {
	if (!partners.length) {
		return (
			<EmptyState
				icon={<Buildings size={40} variant="Bulk" />}
				title="No partners yet"
				description="Add a hotel, riad or company to prepare their quotes and invoices."
			/>
		);
	}

	return (
		<EntityCardGrid>
			{partners.map((partner) => {
				const contacts = partner.contacts ?? [];
				const mainContact = contacts.find((c) => c.isPrimary) ?? contacts[0];
				const documents = partner.documents?.length ?? 0;
				return (
					<EntityCard
						key={partner.id}
						menu={<PartnerActions partner={partner} />}
						header={
							<EntityCardHeader
								href={`/b2b/partners/${partner.id}`}
								title={partner.companyName}
								media={
									<div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
										<Buildings size={28} variant="Bulk" />
									</div>
								}
							>
								{/* Its own line, so the ICE below starts at the same edge as the name. */}
								<span className="text-muted-foreground line-clamp-1 basis-full text-sm">
									{partner.address || "No address yet"}
								</span>
								{partner.taxId ? (
									<span className="relative z-10">
										<CopyableTaxId taxId={partner.taxId} />
									</span>
								) : null}
							</EntityCardHeader>
						}
						figures={
							<EntityCardFigures>
								<Figure label="Documents" value={documents} />
								<Figure label="Contacts" value={contacts.length} />
							</EntityCardFigures>
						}
						actions={
							<div className="flex w-full items-center gap-3">
								{mainContact?.phone ? (
									<a
										href={`tel:${mainContact.phone}`}
										aria-label={`Call ${mainContact.fullName}`}
										className="bg-primary/10 text-primary hover:bg-primary/15 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors active:scale-95"
									>
										<Call size={20} variant="Bulk" />
									</a>
								) : null}
								<Link
									href={`/b2b/documents/new?partner=${partner.id}`}
									className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 flex-1 items-center justify-center gap-2 rounded-full font-semibold transition-colors active:scale-[0.98]"
								>
									<DocumentText size={20} variant="Bold" />
									New quotation
								</Link>
							</div>
						}
					/>
				);
			})}
		</EntityCardGrid>
	);
}
