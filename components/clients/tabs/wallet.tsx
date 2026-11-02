"use client";

import { Money } from "@/components/money";
import { PAYMENT_METHOD } from "@/components/payment-methods";
import { Button } from "@/components/ui/button";
import { creditsSummary } from "@/lib/domain/clients/card";
import { type CardState,cardState } from "@/lib/domain/clients/membership-sale";
import { type Discount } from "@/lib/types";
import { formatDay, studioDateString } from "@/lib/utils/time";
import { cn } from "@/lib/utils/ui";
import { type ClientWallet, type Product } from "@/services/database/schema";

import { Bag2, Card } from "iconsax-reactjs";

import { discountTerms, SellMembershipSheet } from "../sell-membership-sheet";

type WalletWithProduct = ClientWallet & { product?: Product | null };

const longDay = (date: string) => formatDay(date, { day: "numeric", month: "long", year: "numeric" });

const STATE: Record<CardState, { label: string; dot: string; text: string }> = {
	active: { label: "In use", dot: "bg-success", text: "text-success" },
	expired: { label: "Expired", dot: "bg-destructive", text: "text-destructive" },
	empty: { label: "Used up", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
	cancelled: { label: "Cancelled", dot: "bg-muted-foreground/40", text: "text-muted-foreground" },
};
// Cards she can use first, the one ending soonest on top; then the rest, latest first.
const ORDER: CardState[] = ["active", "expired", "empty", "cancelled"];

interface WalletTabProps {
	clientId: string;
	wallets: WalletWithProduct[];
	/** Her memberships on sale. */
	products: Product[];
	discounts?: Discount[];
	clientDiscountId?: string | null;
	/** The sale sheet, opened from here or from the profile's alert. */
	selling?: boolean;
	onSellingChange?: (open: boolean) => void;
}

/**
 * The client's membership cards: what they can use today, and every card
 * they were sold, with where it stands (in use until a day, expired with
 * the credits it held, used up), how it was sold, and a way to sell one.
 */
export function WalletTab({
	clientId,
	wallets,
	products,
	discounts = [],
	clientDiscountId,
	selling = false,
	onSellingChange = () => {},
}: WalletTabProps) {
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

	return (
		<div className="mx-auto grid max-w-3xl gap-8">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-muted-foreground text-sm">Credits to use</p>
					<p className="flex items-baseline gap-2">
						<span
							className={cn(
								"font-heading text-5xl font-bold tabular-nums",
								credits.tone === "low" || credits.tone === "expired" ? "text-destructive" : "text-foreground",
							)}
						>
							{credits.count ?? 0}
						</span>
						{credits.total ? <span className="text-muted-foreground">of {credits.total}</span> : null}
					</p>
					<p className="text-muted-foreground text-sm">
						{credits.tone === "expired"
							? `Their card expired on ${longDay(credits.expiredOn!)}.`
							: paying
								? `${paying.product?.name ?? "Their card"}${paying.expiresOn ? `, until ${longDay(paying.expiresOn)}` : ", no end date"}`
								: "No card in use."}
					</p>
				</div>
				<SellMembershipSheet
					clientId={clientId}
					memberships={products}
					discounts={discounts}
					clientDiscountId={clientDiscountId}
					open={selling}
					onOpenChange={onSellingChange}
					trigger={
						<Button className="zen-glow-teal h-11 rounded-xl px-5 font-semibold">
							<Bag2 className="mr-2 size-5" variant="Bold" />
							Sell a membership
						</Button>
					}
				/>
			</div>

			<section aria-labelledby="cards-title" className="grid gap-3">
				<h3 id="cards-title" className="font-heading text-lg font-semibold">
					Cards
				</h3>
				{cards.length === 0 ? (
					<p className="text-muted-foreground bg-card rounded-2xl border border-dashed p-6 text-center text-sm">
						No card sold yet.
					</p>
				) : (
					<ul className="bg-card divide-border divide-y rounded-2xl border">
						{cards.map(({ wallet, state }) => {
							const look = STATE[state];
							const total = wallet.product?.credits;
							const sold = wallet.activatedAt ? studioDateString(new Date(wallet.activatedAt)) : null;
							const sale = [
								sold ? `Sold ${formatDay(sold, { day: "numeric", month: "short", year: "numeric" })}` : null,
								wallet.paymentMethod ? PAYMENT_METHOD[wallet.paymentMethod].label : null,
								wallet.discountName && wallet.discountType && wallet.discountValue
									? `${wallet.discountName} ${discountTerms({ discountType: wallet.discountType, discountValue: wallet.discountValue })}`
									: null,
								wallet.physicalCardRef ? `Card no. ${wallet.physicalCardRef}` : null,
							].filter(Boolean);
							return (
								<li key={wallet.id} className="flex items-start gap-3 p-4">
									<span
										className={cn(
											"bg-secondary/50 flex size-10 shrink-0 items-center justify-center rounded-xl",
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
											{state === "expired"
												? `Ended ${longDay(wallet.expiresOn!)}: its ${wallet.remainingCredits} ${wallet.remainingCredits === 1 ? "credit" : "credits"} can't be used.`
												: wallet.expiresOn
													? `${state === "active" ? "Until" : "Ran until"} ${longDay(wallet.expiresOn)}`
													: "No end date"}
										</p>
										{sale.length ? <p className="text-muted-foreground text-sm">{sale.join(" · ")}</p> : null}
									</div>
									<div className="shrink-0 text-right">
										<p className="tabular-nums">
											<span className={cn("text-xl font-semibold", state !== "active" && "text-muted-foreground")}>
												{wallet.remainingCredits}
											</span>
											{total ? <span className="text-muted-foreground text-sm"> of {total}</span> : null}
										</p>
										{wallet.amountPaid ? <Money amount={wallet.amountPaid} className="text-muted-foreground text-sm" /> : null}
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</div>
	);
}
