"use client";

import { useState } from "react";

import { assignProductToClient } from "@/actions/wallets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<div className="mx-auto max-w-3xl space-y-6">
			{/* Status Card */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
					<CardHeader className="pb-2">
						<CardTitle className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
							Remaining Credits
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-baseline gap-2 text-4xl font-bold">
							{totalCredits}
							<span className="text-muted-foreground text-lg font-normal">
								credits
							</span>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-muted/30 flex flex-col items-center justify-center border-dashed p-6 shadow-none">
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button size="lg" className="w-full md:w-auto">
								<ShoppingCart className="mr-2 h-5 w-5" />
								Sell Product
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Sell Membership Product</DialogTitle>
							</DialogHeader>
							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Select Product</Label>
									<Select
										value={selectedProductId}
										onValueChange={setSelectedProductId}
									>
										<SelectTrigger>
											<SelectValue placeholder="Choose a product..." />
										</SelectTrigger>
										<SelectContent>
											{products.map((product) => (
												<SelectItem key={product.id} value={product.id}>
													{product.name} — {product.defaultCredits} Credits (
													{product.basePrice} MAD)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button
									onClick={handleSellProduct}
									disabled={isSubmitting || !selectedProductId}
								>
									{isSubmitting ? "Processing..." : "Confirm Sale"}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<CreditCard className="h-5 w-5" />
						Active Wallets
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{wallets.length === 0 ? (
							<p className="text-muted-foreground text-sm italic">
								No active wallets.
							</p>
						) : (
							wallets.map((wallet) => (
								<div
									key={wallet.id}
									className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
								>
									<div>
										<h4 className="flex items-center gap-2 font-medium">
											{wallet.product?.name || "Unknown Product"}
											{wallet.status === "active" ? (
												<Badge
													variant="outline"
													className="border-green-200 bg-green-50 text-xs text-green-700"
												>
													Active
												</Badge>
											) : (
												<Badge variant="secondary" className="text-xs">
													{wallet.status}
												</Badge>
											)}
										</h4>
										<div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
											<span className="flex items-center gap-1">
												<Tag className="h-3 w-3" />
												{wallet.remainingCredits} credits remaining
											</span>
											<span>
												Activated:{" "}
												{wallet.activatedAt
													? format(new Date(wallet.activatedAt), "PPP")
													: "N/A"}
											</span>
										</div>
									</div>
									{/* Actions like "Use Credit" are handled in check-in, not here directly? Or manual adjust? */}
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
