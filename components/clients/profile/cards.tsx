"use client";

import { useState } from "react";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import { CancelSaleButton } from "@/components/clients/cancel-sale-button";
import { discountTerms, SellMembershipSheet } from "@/components/clients/sell-membership-sheet";
import { Money } from "@/components/money";
import { PAYMENT_METHOD } from "@/components/payment-methods";
import { Button } from "@/components/ui/button";
import { creditsSummary } from "@/lib/domain/clients/card";
import { type CardState,cardState } from "@/lib/domain/clients/membership-sale";
import { type Discount } from "@/lib/types";
import { formatMoney } from "@/lib/utils/currency";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type ClientWallet, type Product } from "@/services/database/schema";

import { Bag2, Card } from "iconsax-reactjs";

type WalletWithProduct = ClientWallet & { product?: Product | null; ledgerEntries?: { id: string }[] };

const longDay = (date: string) => formatDay(date, { day: "numeric", month: "long", year: "numeric" });

const STATE: Record<CardState, { label: string; dot: string; text: string }> = {
	active: { label: "In use", dot: "bg-success", text: "text-success" },
	expired: { label: "Expired", dot: "bg-destructive", text: "text-destructive" },
	empty: { label: "Used up", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
	cancelled: { label: "Sale undone", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
};
// Cards she can use first, the one ending soonest on top; then the rest, latest first.
const ORDER: CardState[] = ["active", "expired", "empty", "cancelled"];

interface CardsSectionProps {
	clientId: string;
	wallets: WalletWithProduct[];
	/** Her memberships on sale. */
	products: Product[];
	discounts?: Discount[];
	clientDiscountId?: string | null;
	/** Open on the sale (from a refused check-in or a renewal). */
	sellOnOpen?: boolean;
}

/**
 * The client's membership cards, first on their page: what they can use
 * today (or why the door would refuse them), every card they were sold
 * with where it stands and how it was sold, and the sale a tap away.
 */
export function CardsSection({
	clientId,
	wallets,
	products,
	discounts = [],
	clientDiscountId,
	sellOnOpen = false,
}: CardsSectionProps) {
	const [selling, setSelling] = useState(sellOnOpen);
	const today = studioDateString();
	const credits = creditsSummary(wallets, today);
	const cards = wallets
		.map((wallet) => ({ wallet, state: cardState(wallet, today) }))
		.sort((a, b) => {
			const byState = ORDER.indexOf(a.state) - ORDER.indexOf(b.state);
			if (byState) return byState;
			if (a.state === "active") return (a.wallet.expiresOn ?? "9999").localeCompare(b.wallet.expiresOn ?? "9999");
			return new Date(b.wallet.activatedAt ?? 0).getTime() - new Date(a.wallet.activatedAt ?? 0).getTime();
		});
	const paying = cards.find((c) => c.state === "active")?.wallet;

	const refused = credits.tone === "expired" || (credits.count !== null && credits.count === 0);

	return (
		<DocumentSection
			id="cards"
			title="Cards"
			aside={
				<SellMembershipSheet
					clientId={clientId}
					memberships={products}
					discounts={discounts}
					clientDiscountId={clientDiscountId}
					open={selling}
					onOpenChange={setSelling}
					trigger={
						<Button className="h-10 rounded-xl px-4 font-semibold">
							<Bag2 className="mr-2 size-5" variant="Bold" />
							Sell a membership
						</Button>
					}
				/>
			}
		>
			<div className="overflow-hidden rounded-2xl border bg-card">
				{/* What the door sees today. */}
				<div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-2 p-5", refused && "bg-destructive/5")}>
					<div>
						<p className="text-sm text-muted-foreground">Credits to use</p>
						<p className="flex items-baseline gap-2">
							<span
								className={cn(
									"font-heading text-5xl leading-none font-bold tabular-nums",
									refused ? "text-destructive" : credits.tone === "low" ? "text-warning" : "text-foreground",
								)}
							>
								{credits.count ?? 0}
							</span>
							{credits.total ? <span className="text-muted-foreground">of {credits.total}</span> : null}
						</p>
					</div>
					<p className={cn("text-sm sm:text-right", refused ? "font-medium text-destructive" : "text-muted-foreground")}>
						{credits.tone === "expired"
							? `Card expired on ${longDay(credits.expiredOn!)}: not accepted at check-in.`
							: paying
								? `${paying.product?.name ?? "Their card"}${paying.expiresOn ? `, until ${longDay(paying.expiresOn)}` : ", no end date"}`
								: cards.length
									? "No credits left: not accepted at check-in."
									: "No card yet."}
					</p>
				</div>

				{cards.length === 0 ? (
					<p className="border-t p-5 text-center text-sm text-muted-foreground">
						Sell a membership to check them in at the door.
					</p>
				) : (
					<ul className="divide-y divide-border border-t">
						{cards.map(({ wallet, state }) => {
							const look = STATE[state];
							const total = wallet.product?.credits;
							const sold = wallet.activatedAt ? studioDateString(new Date(wallet.activatedAt)) : null;
							const undone = state === "cancelled";
							const sale = [
								sold ? `Sold ${formatDay(sold, { day: "numeric", month: "short", year: "numeric" })}` : null,
								wallet.paymentMethod ? PAYMENT_METHOD[wallet.paymentMethod].label : null,
								wallet.discountName && wallet.discountType && wallet.discountValue
									? `${wallet.discountName} ${discountTerms({ discountType: wallet.discountType, discountValue: wallet.discountValue })}`
									: null,
								wallet.physicalCardRef ? `Card no. ${wallet.physicalCardRef}` : null,
							].filter(Boolean);
							return (
								<li key={wallet.id} className="flex items-start gap-3 px-5 py-4">
									<span
										className={cn(
											"flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50",
											state === "active" && "bg-success/10 text-success",
											state === "expired" && "bg-destructive/10 text-destructive",
										)}
									>
										<Card size={20} variant="Bulk" />
									</span>
									<div className="min-w-0 flex-1">
										<p className="flex flex-wrap items-center gap-x-2">
											<span className="truncate font-semibold">{wallet.product?.name ?? "Membership"}</span>
											<span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", look.text)}>
												<span aria-hidden className={cn("size-1.5 rounded-full", look.dot)} />
												{look.label}
											</span>
										</p>
										<p className={cn("text-sm", state === "expired" ? "text-destructive" : "text-muted-foreground")}>
											{undone
												? `Undone${wallet.cancelledAt ? ` ${formatDay(studioDateString(new Date(wallet.cancelledAt)), { day: "numeric", month: "short", year: "numeric" })}` : ""}${wallet.cancelReason ? `. ${wallet.cancelReason}` : ""}`
												: state === "expired"
												? `Ended ${longDay(wallet.expiresOn!)}: its ${wallet.remainingCredits} ${wallet.remainingCredits === 1 ? "credit" : "credits"} can't be used.`
												: wallet.expiresOn
													? `${state === "active" ? "Until" : "Ran until"} ${longDay(wallet.expiresOn)}`
													: "No end date"}
										</p>
										{sale.length ? <p className="text-sm text-muted-foreground">{sale.join(" · ")}</p> : null}
									</div>
									<div className="shrink-0 text-right">
										<p className="tabular-nums">
											<span className={cn("text-xl font-semibold", state !== "active" && "text-muted-foreground", undone && "line-through")}>
												{wallet.remainingCredits}
											</span>
											{total ? <span className="text-sm text-muted-foreground"> of {total}</span> : null}
										</p>
										{wallet.amountPaid ? (
											<Money amount={wallet.amountPaid} className={cn("text-sm text-muted-foreground", undone && "line-through")} />
										) : null}
									</div>
									{undone ? null : (
										<CancelSaleButton
											walletId={wallet.id}
											summary={`${wallet.product?.name ?? "Membership"}${sold ? `, sold ${formatDay(sold, { day: "numeric", month: "short" })}` : ""}${wallet.amountPaid ? ` for ${formatMoney(wallet.amountPaid)}` : ""}`}
											creditsLeft={wallet.remainingCredits}
											visitsTaken={wallet.ledgerEntries?.length ?? 0}
										/>
									)}
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</DocumentSection>
	);
}
