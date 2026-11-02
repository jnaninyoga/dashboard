"use client";

import { useState } from "react";

import { useConfirm } from "@/components/feedback/confirm";
import { Money } from "@/components/money";
import { ProductSheet } from "@/components/price-list/product-sheet";
import { RowActionsTrigger } from "@/components/row-actions-trigger";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { deleteProductAction, setProductArchivedAction } from "@/lib/actions/price-list";
import { groupSize } from "@/lib/domain/price-list/product";
import { notify, notifyActionError } from "@/lib/feedback/notify";
import { type Product } from "@/lib/types";

import {
	ArchiveBook as Archive,
	Edit2 as Edit,
	RotateLeft,
	Trash,
} from "iconsax-reactjs";

export function B2BTierList({ initialTiers }: { initialTiers: Product[] }) {
	const [editingTier, setEditingTier] = useState<Product | null>(null);

	const activeTiers = initialTiers.filter((t) => !t.isArchived);
	const archivedTiers = initialTiers.filter((t) => t.isArchived);

	const confirm = useConfirm();

	const handleDelete = async (id: string) => {
		const ok = await confirm({
			title: "Delete this rate?",
			description: "This can't be undone. Archive it instead to keep it for reference.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		const result = await deleteProductAction(id);
		if (result.error) {
			notifyActionError(result, "Something went wrong");
		} else {
			notify.success("Rate deleted");
		}
	};

	const handleToggleArchive = async (tier: Product) => {
		const result = await setProductArchivedAction(tier.id, !tier.isArchived);
		if (result.error) {
			notifyActionError(result, "Something went wrong");
		} else {
			notify.success(tier.isArchived ? "Rate restored" : "Rate archived");
		}
	};

	return (
		<div className="space-y-8">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Group</TableHead>
						<TableHead>Per session</TableHead>
						<TableHead className="pr-6 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activeTiers.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								No partner rates yet.
							</TableCell>
						</TableRow>
					) : (
						activeTiers.map((tier) => (
							<TableRow key={tier.id}>
								<TableCell className="pl-6 font-medium">{tier.name}</TableCell>
								<TableCell>{groupSize(tier) ?? "Any group"}</TableCell>
								<TableCell><Money amount={tier.price} /></TableCell>
								<TableCell className="pr-6 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<RowActionsTrigger label={`Actions for ${tier.name}`} />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuItem onClick={() => setEditingTier(tier)}>
												<Edit className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleToggleArchive(tier)}
											>
												<Archive className="mr-2 h-4 w-4" />
												Archive
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDelete(tier.id)}
												className="focus:bg-secondary text-destructive focus:text-destructive focus:[&_svg]:text-destructive"
											>
												<Trash
													className="text-destructive mr-2 h-4 w-4"
													variant="Outline"
												/>
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			{archivedTiers.length > 0 ? (
				<div className="opacity-70">
					<h3 className="text-muted-foreground mb-2 text-sm font-medium">
						Archived
					</h3>
					<div>
						<Table>
							<TableBody>
								{archivedTiers.map((tier) => (
									<TableRow key={tier.id} className="bg-muted/50">
										<TableCell className="font-medium">{tier.name}</TableCell>
										<TableCell>{groupSize(tier) ?? "Any group"}</TableCell>
										<TableCell><Money amount={tier.price} /></TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleToggleArchive(tier)}
											>
												<RotateLeft className="mr-2 h-4 w-4" /> Restore
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</div>
			) : null}

			{editingTier ? (
				<ProductSheet
					kind="partner_service"
					open={!!editingTier}
					onOpenChange={(open) => !open && setEditingTier(null)}
					product={editingTier}
				/>
			) : null}
		</div>
	);
}
