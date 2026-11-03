"use client";

import { useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { EntityCard, EntityCardFigures, EntityCardGrid, EntityCardHeader, Figure } from "@/components/entity-card";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { deleteProductAction, type ProductUsage, setProductArchivedAction } from "@/lib/actions/price-list";
import { fold } from "@/lib/domain/billing/price-list";
import { shortDay } from "@/lib/domain/clients/card";
import { groupSize, productLabel } from "@/lib/domain/price-list/product";
import { type Product, type ProductKind } from "@/lib/types";
import { formatMoney } from "@/lib/utils/currency";
import { studioDateString } from "@/lib/utils/time";

import { AddCircle, Card, DocumentText, Tag2 } from "iconsax-reactjs";

import { ArchivedShelf, PriceListMenu, PriceListTile } from "./price-list-card";
import { ProductSheet } from "./product-sheet";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** What a membership gives: "10 visits · 1 month". */
const membershipTerms = (p: Product) =>
	`${plural(p.credits ?? 0, "visit", "visits")} · ${p.durationMonths ? plural(p.durationMonths, "month", "months") : "no end"}`;

const NEW_LABEL: Record<ProductKind, string> = { membership: "New membership", partner_service: "New rate" };

/** The page's "New …" button, with its sheet. */
export function NewProductButton({ kind }: { kind: ProductKind }) {
	const [open, setOpen] = useState(false);
	return (
		<ProductSheet
			kind={kind}
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button className="zen-glow-teal h-11 rounded-xl px-5 font-semibold">
					<AddCircle className="mr-2 size-5" variant="Bold" />
					{NEW_LABEL[kind]}
				</Button>
			}
		/>
	);
}

/**
 * One kind of her price list as cards: what it is, its price, and what
 * it's doing in the studio (cards in use, the quotations it's on). Tapping a
 * card changes it; what she stopped offering waits below, to put back.
 */
export function ProductGrid({
	kind,
	products,
	usage,
}: {
	kind: ProductKind;
	/** On sale and archived. */
	products: Product[];
	usage: Record<string, ProductUsage>;
}) {
	const [editing, setEditing] = useState<Product | null>(null);
	const [creating, setCreating] = useState(false);
	const today = studioDateString();
	const onSale = products.filter((p) => !p.isArchived);
	const archived = products.filter((p) => p.isArchived);
	// The same item twice (from before the price list refused it): each copy says so.
	const twice = new Set(
		onSale
			.map((p) => fold(productLabel(p)))
			.filter((label, i, labels) => labels.indexOf(label) !== i),
	);

	return (
		<div className="grid gap-10">
			{onSale.length ? (
				<EntityCardGrid>
					{onSale.map((product) => {
						const used = usage[product.id];
						return (
							<EntityCard
								key={product.id}
								menu={
									<PriceListMenu
										name={product.name}
										noun={kind === "membership" ? "membership" : "rate"}
										onEdit={() => setEditing(product)}
										archive={() => setProductArchivedAction(product.id, true)}
										remove={() => deleteProductAction(product.id)}
									/>
								}
								header={
									<EntityCardHeader
										onOpen={() => setEditing(product)}
										title={product.name}
										media={
											kind === "membership" ? (
												<PriceListTile icon={<Card size={28} variant="Bulk" />} />
											) : (
												<PriceListTile tone="blush" icon={<Tag2 size={28} variant="Bulk" />} />
											)
										}
									>
										<span className="text-sm text-muted-foreground">
											{kind === "membership"
												? membershipTerms(product)
												: `${groupSize(product) ?? "Any group"} · per session`}
										</span>
										{twice.has(fold(productLabel(product))) ? (
											<span className="basis-full text-sm font-medium text-warning">Listed twice: archive one</span>
										) : null}
									</EntityCardHeader>
								}
								figures={
									<EntityCardFigures>
										<Figure label={kind === "membership" ? "Price" : "Per session"} value={<Money amount={product.price} />} />
										{kind === "membership" ? (
											<Figure label="In use" value={used?.inUse ?? 0} unit={(used?.inUse ?? 0) === 1 ? "card" : "cards"} />
										) : (
											<Figure label="Quotations" value={used?.documents ?? 0} />
										)}
									</EntityCardFigures>
								}
								actions={
									kind === "partner_service" && used?.lastDocument ? (
										<Link
											href={`/b2b/documents/${used.lastDocument.id}`}
											className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
										>
											<DocumentText size={18} variant="Bulk" />
											Last on {used.lastDocument.documentNumber ?? "a draft"}, {shortDay(used.lastDocument.issueDate, today)}
										</Link>
									) : (
										<p className="text-sm text-muted-foreground">
											{kind === "membership"
												? used?.lastSoldAt
													? `Last sold ${shortDay(studioDateString(new Date(used.lastSoldAt)), today)}`
													: "Not sold yet"
												: "Not on a quotation yet"}
										</p>
									)
								}
							/>
						);
					})}
				</EntityCardGrid>
			) : (
				<EmptyState
					icon={kind === "membership" ? <Card size={40} variant="Bulk" /> : <Tag2 size={40} variant="Bulk" />}
					title={kind === "membership" ? "No membership on sale" : "No partner rates yet"}
					description={
						kind === "membership"
							? "Add the cards you sell: their credits, how long they last, their price."
							: "Add what you charge hotels for a session: “Famille”, 3 to 5 people, 450 MAD."
					}
					action={
						<Button onClick={() => setCreating(true)} className="h-11 rounded-xl px-5 font-semibold">
							{NEW_LABEL[kind]}
						</Button>
					}
				/>
			)}

			<ArchivedShelf
				items={archived}
				describe={(p) =>
					kind === "membership"
						? `${membershipTerms(p)} · ${formatMoney(p.price)}`
						: `${groupSize(p) ?? "Any group"} · ${formatMoney(p.price)} per session`
				}
				restore={(p) => setProductArchivedAction(p.id, false)}
			/>

			<ProductSheet
				kind={kind}
				open={creating || !!editing}
				onOpenChange={(open) => {
					if (!open) {
						setEditing(null);
						setCreating(false);
					}
				}}
				product={editing ?? undefined}
			/>
		</div>
	);
}
