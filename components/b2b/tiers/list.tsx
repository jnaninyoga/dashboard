"use client";

import { useState } from "react";

import {
	deleteB2BTierAction,
	toggleArchiveB2BTierAction,
} from "@/actions/settings";
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
import { type B2BTier } from "@/lib/types";

import {
	ArchiveBook as Archive,
	Edit2 as Edit,
	More,
	RotateLeft,
	Trash,
} from "iconsax-reactjs";
import { toast } from "sonner";

import { B2BTierDialog } from "./dialog";

export function B2BTierList({ initialTiers }: { initialTiers: B2BTier[] }) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingTier, setEditingTier] = useState<B2BTier | null>(null);

	const activeTiers = initialTiers.filter((t) => !t.isArchived);
	const archivedTiers = initialTiers.filter((t) => t.isArchived);

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this tier?")) return;
		const result = await deleteB2BTierAction(id);
		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success("Tier deleted");
		}
	};

	const handleToggleArchive = async (tier: B2BTier) => {
		const result = await toggleArchiveB2BTierAction(tier.id, tier.isArchived);
		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success(tier.isArchived ? "Tier restored" : "Tier archived");
		}
	};

	return (
		<div className="space-y-8">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Price (MAD)</TableHead>
						<TableHead className="pr-6 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activeTiers.length === 0 ? (
						<TableRow>
							<TableCell colSpan={3} className="h-24 text-center">
								No active B2B tiers.
							</TableCell>
						</TableRow>
					) : (
						activeTiers.map((tier) => (
							<TableRow key={tier.id}>
								<TableCell className="pl-6 font-medium">{tier.name}</TableCell>
								<TableCell>{tier.price} MAD</TableCell>
								<TableCell className="pr-6 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<More className="h-4 w-4" />
											</Button>
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
												className="focus:bg-secondary text-red-600 focus:text-red-600 focus:[&_svg]:text-red-600"
											>
												<Trash
													className="mr-2 h-4 w-4 text-red-600"
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
						Archived Tiers
					</h3>
					<div>
						<Table>
							<TableBody>
								{archivedTiers.map((tier) => (
									<TableRow key={tier.id} className="bg-muted/50">
										<TableCell className="font-medium">{tier.name}</TableCell>
										<TableCell>{tier.price} MAD</TableCell>
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

			<B2BTierDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{editingTier ? (
				<B2BTierDialog
					open={!!editingTier}
					onOpenChange={(open) => !open && setEditingTier(null)}
					tier={editingTier}
				/>
			) : null}
		</div>
	);
}
