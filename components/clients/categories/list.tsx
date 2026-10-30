"use client";

import { useState } from "react";

import { useConfirm } from "@/components/feedback/confirm";
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
import {
	archiveClientCategory,
	deleteClientCategory,
	restoreClientCategory,
} from "@/lib/actions/settings";
import { notify } from "@/lib/feedback/notify";
import { type Discount } from "@/lib/types";

import {
	ArchiveBook as Archive,
	Edit2 as Edit,
	RotateLeft,
	Trash,
} from "iconsax-reactjs";

import { CategoryDialog } from "./dialog";

export function CategoryList({
	initialCategories,
}: {
	initialCategories: Discount[];
}) {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<Discount | null>(null);

	const activeCategories = initialCategories.filter((c) => !c.isArchived);
	const archivedCategories = initialCategories.filter((c) => c.isArchived);

	const confirm = useConfirm();

	const handleDelete = async (id: string) => {
		const ok = await confirm({
			title: "Delete this category?",
			description: "This can't be undone. Archive it instead to keep it for existing clients.",
			confirmLabel: "Delete",
			destructive: true,
		});
		if (!ok) return;
		try {
			await deleteClientCategory(id);
			notify.success("Category deleted");
		} catch (error) {
			notify.error("Couldn't delete this category", { error });
		}
	};

	const handleArchive = async (id: string) => {
		const ok = await confirm({
			title: "Archive this category?",
			description: "It won't be selectable for new clients. You can restore it later.",
			confirmLabel: "Archive",
		});
		if (!ok) return;
		try {
			await archiveClientCategory(id);
			notify.success("Category archived");
		} catch (error) {
			notify.error("Couldn't archive this category", { error });
		}
	};

	const handleRestore = async (id: string) => {
		try {
			await restoreClientCategory(id);
			notify.success("Category restored");
		} catch (error) {
			notify.error("Couldn't restore this category", { error });
		}
	};

	return (
		<div className="space-y-8">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="pl-6">Name</TableHead>
						<TableHead>Discount Type</TableHead>
						<TableHead>Value</TableHead>
						<TableHead className="pr-6 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{activeCategories.length === 0 ? (
						<TableRow>
							<TableCell colSpan={4} className="h-24 text-center">
								No active discounts.
							</TableCell>
						</TableRow>
					) : (
						activeCategories.map((category) => (
							<TableRow key={category.id}>
								<TableCell className="pl-6 font-medium">
									{category.name}
								</TableCell>
								<TableCell className="capitalize">
									{category.discountType}
								</TableCell>
								<TableCell>
									{category.discountType === "percentage"
										? `${category.discountValue}%`
										: `${category.discountValue} MAD`}
								</TableCell>
								<TableCell className="pr-6 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<RowActionsTrigger label={`Actions for ${category.name}`} />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>Actions</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={() => setEditingCategory(category)}
											>
												<Edit className="mr-2 h-4 w-4" />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleArchive(category.id)}
											>
												<Archive className="mr-2 h-4 w-4" />
												Archive
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => handleDelete(category.id)}
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

			{archivedCategories.length > 0 ? (
				<div className="opacity-70">
					<h3 className="text-muted-foreground mb-2 text-sm font-medium">
						Archived Categories
					</h3>
					<div>
						<Table>
							<TableBody>
								{archivedCategories.map((category) => (
									<TableRow key={category.id} className="bg-muted/50">
										<TableCell className="font-medium">
											{category.name}
										</TableCell>
										<TableCell className="capitalize">
											{category.discountType}
										</TableCell>
										<TableCell>
											{category.discountType === "percentage"
												? `${category.discountValue}%`
												: `${category.discountValue} MAD`}
										</TableCell>
										<TableCell className="text-right">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleRestore(category.id)}
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

			<CategoryDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />

			{editingCategory ? (
				<CategoryDialog
					open={!!editingCategory}
					onOpenChange={(open) => !open && setEditingCategory(null)}
					category={editingCategory}
				/>
			) : null}
		</div>
	);
}
