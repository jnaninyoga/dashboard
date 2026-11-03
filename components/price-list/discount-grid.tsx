"use client";

import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { EntityCard, EntityCardFigures, EntityCardGrid, EntityCardHeader, Figure } from "@/components/entity-card";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { deleteDiscountAction, setDiscountArchivedAction } from "@/lib/actions/settings";
import { priceAfterDiscount } from "@/lib/domain/clients/membership-sale";
import { type Discount, type Product } from "@/lib/types";
import { formatAmount, formatMoney } from "@/lib/utils/currency";

import { AddCircle, DiscountShape } from "iconsax-reactjs";

import { DiscountSheet } from "./discount-sheet";
import { ArchivedShelf, PriceListMenu, PriceListTile } from "./price-list-card";

/** What a discount takes off, as a figure: "12,5 %" or an amount. */
function DiscountValue({ discount }: { discount: Discount }) {
	return discount.discountType === "percentage" ? (
		<span>
			{Number(discount.discountValue).toLocaleString("fr-FR", { maximumFractionDigits: 2 })}
			<span className="ml-[0.3em] text-[max(0.625rem,0.5em)] font-medium opacity-60">%</span>
		</span>
	) : (
		<Money amount={discount.discountValue} />
	);
}

const termsOf = (discount: Discount) =>
	discount.discountType === "percentage"
		? `${Number(discount.discountValue).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} % off`
		: `${formatMoney(discount.discountValue)} off`;

/** The page's "New discount" button, with its sheet. */
export function NewDiscountButton({ memberships }: { memberships: Product[] }) {
	const [open, setOpen] = useState(false);
	return (
		<DiscountSheet
			memberships={memberships}
			open={open}
			onOpenChange={setOpen}
			trigger={
				<Button className="zen-glow-teal h-11 rounded-xl px-5 font-semibold">
					<AddCircle className="mr-2 size-5" variant="Bold" />
					New discount
				</Button>
			}
		/>
	);
}

/**
 * Her discounts as cards: what each takes off, how many clients have it,
 * and what it makes of her cheapest card.
 */
export function DiscountGrid({
	discounts,
	clientCounts,
	memberships,
}: {
	discounts: Discount[];
	clientCounts: Record<string, number>;
	/** Her memberships on sale, cheapest first. */
	memberships: Product[];
}) {
	const [editing, setEditing] = useState<Discount | null>(null);
	const [creating, setCreating] = useState(false);
	const offered = discounts.filter((d) => !d.isArchived);
	const archived = discounts.filter((d) => d.isArchived);
	const cheapest = memberships[0];

	return (
		<div className="grid gap-10">
			{offered.length ? (
				<EntityCardGrid>
					{offered.map((discount) => {
						const clients = clientCounts[discount.id] ?? 0;
						const example = cheapest ? priceAfterDiscount(cheapest.price, discount) : null;
						return (
							<EntityCard
								key={discount.id}
								menu={
									<PriceListMenu
										name={discount.name}
										noun="discount"
										onEdit={() => setEditing(discount)}
										archive={() => setDiscountArchivedAction(discount.id, true)}
										remove={() => deleteDiscountAction(discount.id)}
									/>
								}
								header={
									<EntityCardHeader
										onOpen={() => setEditing(discount)}
										title={discount.name}
										media={<PriceListTile tone="blush" icon={<DiscountShape size={28} variant="Bulk" />} />}
									>
										<span className="text-sm text-muted-foreground">Off every membership</span>
									</EntityCardHeader>
								}
								figures={
									<EntityCardFigures>
										<Figure label="Takes off" value={<DiscountValue discount={discount} />} />
										<Figure label="Clients" value={clients} />
									</EntityCardFigures>
								}
								actions={
									example && cheapest ? (
										<p className="flex flex-wrap items-baseline gap-x-1.5 text-sm text-muted-foreground">
											<span className="truncate">{cheapest.name}:</span>
											<s>{formatAmount(example.list)}</s>
											<span aria-hidden>→</span>
											<Money amount={example.price} className="font-semibold text-foreground" />
										</p>
									) : (
										<p className="text-sm text-muted-foreground">No membership on sale to apply it to.</p>
									)
								}
							/>
						);
					})}
				</EntityCardGrid>
			) : (
				<EmptyState
					icon={<DiscountShape size={40} variant="Bulk" />}
					title="No discounts yet"
					description="Add the discounts you give, like Senior −12,5 %: a client who has one gets it on every card."
					action={
						<Button onClick={() => setCreating(true)} className="h-11 rounded-xl px-5 font-semibold">
							New discount
						</Button>
					}
				/>
			)}

			<ArchivedShelf
				items={archived}
				describe={(d) => `${termsOf(d)} · ${clientCounts[d.id] ?? 0} ${(clientCounts[d.id] ?? 0) === 1 ? "client keeps it" : "clients keep it"}`}
				restore={(d) => setDiscountArchivedAction(d.id, false)}
			/>

			<DiscountSheet
				discount={editing ?? undefined}
				memberships={memberships}
				open={creating || !!editing}
				onOpenChange={(open) => {
					if (!open) {
						setEditing(null);
						setCreating(false);
					}
				}}
			/>
		</div>
	);
}
