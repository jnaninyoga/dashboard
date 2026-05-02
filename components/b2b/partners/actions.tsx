"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePartnerAction } from "@/lib/actions/b2b/partners";
import { type PartnerWithRelations } from "@/lib/types/b2b";

import { Buildings, Edit2, More, Trash } from "iconsax-reactjs";
import { toast } from "sonner";

import { PartnerDialog } from "./dialog";

interface PartnerActionsProps {
	partner: PartnerWithRelations;
	triggerClassName?: string;
}

export function PartnerActions({
	partner,
	triggerClassName,
}: PartnerActionsProps) {
	const router = useRouter();
	const [editOpen, setEditOpen] = useState(false);
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		if (
			!confirm(
				`Delete ${partner.companyName}? This cannot be undone. Partners with quotes or invoices cannot be deleted — archive their documents first.`,
			)
		) {
			return;
		}
		startTransition(async () => {
			const res = await deletePartnerAction(partner.id);
			if (res.success) {
				toast.success("Partner deleted");
				router.refresh();
			} else {
				toast.error(res.error || "Failed to delete partner");
			}
		});
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className={
							triggerClassName ??
							"hover:bg-secondary h-9 w-9 rounded-xl transition-all"
						}
						disabled={isPending}
					>
						<More size={20} className="rotate-90" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="border-secondary/20 w-48 rounded-xl shadow-xl"
				>
					<DropdownMenuItem
						asChild
						className="cursor-pointer p-3 text-xs font-bold tracking-wide uppercase"
					>
						<Link
							href={`/b2b/partners/${partner.id}`}
							className="flex items-center gap-2"
						>
							<Buildings size={16} variant="Outline" />
							View Profile
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer p-3 text-xs font-bold tracking-wide uppercase"
						onSelect={(e) => {
							// Keep the dropdown's own close behaviour, then open our dialog
							// on the next tick so focus management doesn't fight us.
							e.preventDefault();
							setTimeout(() => setEditOpen(true), 0);
						}}
					>
						<Edit2 size={16} variant="Outline" />
						Edit Partner
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						onSelect={(e) => {
							e.preventDefault();
							handleDelete();
						}}
						className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive focus:[&>svg]:text-destructive flex cursor-pointer items-center gap-2 p-3 text-xs font-bold tracking-wide uppercase"
					>
						<Trash size={16} variant="Bulk" className="text-destructive" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<PartnerDialog
				partner={partner}
				open={editOpen}
				onOpenChange={setEditOpen}
			/>
		</>
	);
}
