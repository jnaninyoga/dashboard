"use client";

import { useState } from "react";

import { assignProductToClient } from "@/actions/clients/wallets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type ClientWallet, type MembershipProduct } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

import { format } from "date-fns";
import { Bag2 as ShoppingCart, Card as CreditCard, Tag } from "iconsax-reactjs";

type WalletWithProduct = ClientWallet & { product?: MembershipProduct | null };

interface WalletTabProps {
	clientId: string;
	wallets: WalletWithProduct[];
	products: MembershipProduct[];
}

export function WalletTab({ clientId, wallets, products }: WalletTabProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string>("");

	// Calculate total credits
	const totalCredits = wallets
		.filter((w) => w.status === "active")
		.reduce((sum, w) => sum + (w.remainingCredits || 0), 0);

	const handleSellProduct = async () => {
		if (!selectedProductId) return;
		setIsSubmitting(true);

		try {
			const result = await assignProductToClient(clientId, selectedProductId);
			if (result.success) {
				setIsOpen(false);
				setSelectedProductId("");
			} else {
				alert("Failed to assign product");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-8">
			{/* Overview Row */}
			<div className="grid gap-6 sm:grid-cols-2">
				{/* Total Credits Summary Bubble - Now with stronger background */}
				<div className="group bg-secondary/30 hover:bg-secondary/50 hover:zen-glow-blush relative overflow-hidden rounded-3xl border p-6 shadow-sm transition-all">
					<div className="relative z-10">
						<h4 className="text-foreground text-xs font-bold tracking-wider uppercase opacity-40">
							Total Available
						</h4>
						<div className="mt-2 flex items-baseline gap-2">
							<span className="text-foreground text-5xl font-black">
								{totalCredits}
							</span>
							<span className="text-foreground/60 text-lg font-bold">
								credits
							</span>
						</div>
					</div>
					{/* Decorative ambient icon */}
					<CreditCard
						className="text-secondary-foreground group-hover:text-foreground absolute -right-4 -bottom-4 h-32 w-32 rotate-12 opacity-10 transition-all group-hover:scale-110 group-hover:rotate-6"
						variant="Bulk"
					/>
				</div>

				{/* Quick Sell Action Bubble - Now with stronger background */}
				<div className="bg-muted border-secondary/30 hover:zen-glow-teal hover:bg-card flex flex-col items-center justify-center rounded-3xl border p-6 shadow-sm transition-all">
					<div className="mb-4 text-center">
						<h4 className="text-secondary-foreground text-xs font-bold tracking-wider uppercase opacity-60">
							Top-up Wallet
						</h4>
						<p className="text-muted-foreground text-xs font-medium">
							Add credits or membership
						</p>
					</div>
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button className="zen-glow-teal h-12 w-full rounded-2xl px-6 font-bold transition-all active:scale-95">
								<ShoppingCart className="mr-2 size-5" variant="Bold" />
								Sell Product
							</Button>
						</DialogTrigger>
						<DialogContent className="rounded-3xl p-6">
							<DialogHeader>
								<DialogTitle className="text-2xl font-bold">
									Assign Product
								</DialogTitle>
							</DialogHeader>
							<div className="space-y-6 pt-4">
								<div className="space-y-2">
									<Label className="text-xs font-bold tracking-wider uppercase opacity-60">
										Selected Product
									</Label>
									<Select
										value={selectedProductId}
										onValueChange={setSelectedProductId}
									>
										<SelectTrigger className="h-11 rounded-xl border">
											<SelectValue placeholder="Choose a membership..." />
										</SelectTrigger>
										<SelectContent>
											{products.map((product) => (
												<SelectItem key={product.id} value={product.id}>
													{product.name} — {product.defaultCredits} Cr (
													{product.basePrice} MAD)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter className="mt-6">
								<Button
									onClick={handleSellProduct}
									disabled={isSubmitting || !selectedProductId}
									className="h-12 w-full rounded-2xl font-bold"
								>
									{isSubmitting ? "Processing Sale..." : "Confirm & Activate"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Active Wallets Timeline */}
			<div className="space-y-4">
				<div className="mb-2 flex items-center gap-2 px-1">
					<div className="bg-secondary-3 h-1 w-8 rounded-full" />
					<h4 className="text-secondary-foreground text-xs font-bold tracking-wider uppercase opacity-40">
						Active Wallets
					</h4>
				</div>

				<div className="space-y-3">
					{wallets.length === 0 ? (
						<div className="bg-muted rounded-3xl border border-dashed py-8 text-center shadow-sm">
							<p className="text-muted-foreground text-sm italic">
								No active products or credit packs.
							</p>
						</div>
					) : (
						wallets.map((wallet) => (
							<div
								key={wallet.id}
								className="group border/50 hover:zen-glow-teal bg-card flex items-center justify-between gap-4 rounded-3xl border p-4 shadow-xs transition-all hover:shadow-md"
							>
								<div className="flex items-center gap-4">
									<div
										className={cn(
											"flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm",
											wallet.status === "active"
												? "bg-green-100/50 text-green-600"
												: "bg-secondary-3/10 text-secondary-3",
										)}
									>
										<Tag className="h-6 w-6" variant="Bulk" />
									</div>
									<div className="flex flex-col gap-2">
										<div className="flex items-center gap-2">
											<span className="text-secondary-foreground text-lg leading-none font-bold">
												{wallet.product?.name || "Member Pack"}
											</span>
											{wallet.status === "active" ? (
												<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
											) : null}
										</div>
										<span className="text-secondary-foreground text-[10px] font-bold tracking-wider uppercase opacity-40">
											Activated{" "}
											{wallet.activatedAt
												? format(new Date(wallet.activatedAt), "MMMM d, yyyy")
												: "Pending"}
										</span>
									</div>
								</div>

								<div className="flex flex-col items-end">
									<div className="flex items-baseline gap-1">
										<span
											className={cn(
												"text-2xl font-black",
												(wallet.remainingCredits || 0) <= 2
													? "text-red-500"
													: "text-primary",
											)}
										>
											{wallet.remainingCredits}
										</span>
										<span className="text-[10px] font-bold tracking-wider uppercase opacity-60">
											Credits
										</span>
									</div>
									<Badge
										variant={
											wallet.status === "active" ? "outline" : "secondary"
										}
										className={cn(
											"mt-1 px-1.5 py-0 text-[9px] font-bold tracking-tighter uppercase",
											wallet.status === "active" &&
												"border-green-200 bg-green-50 text-green-700",
										)}
									>
										{wallet.status}
									</Badge>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
