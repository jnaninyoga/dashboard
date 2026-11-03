"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Archive, ArchiveBook } from "iconsax-reactjs";

export function ArchiveDocumentDialog({
	documentNumber,
	open,
	onOpenChange,
	onConfirm,
	pending,
}: {
	documentNumber: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (reason: string) => void;
	pending: boolean;
}) {
	const [reason, setReason] = useState("");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="zen-shadow-lg overflow-hidden rounded-3xl border-none p-0 sm:max-w-[440px]">
				<DialogHeader className="border-b bg-card p-8 pb-6">
					<div className="flex items-center gap-4">
						<div className="flex size-12 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
							<ArchiveBook size={24} variant="Bulk" />
						</div>
						<div>
							<DialogTitle className="text-xl font-bold tracking-tight">
								Archive {documentNumber}?
							</DialogTitle>
							<DialogDescription>
								Issued documents are kept on file. Archiving hides this from
								active lists but preserves the audit trail.
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 bg-card p-8">
					<div className="space-y-2">
						<Label
							htmlFor="archive-reason"
							className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase"
						>
							Reason (optional)
						</Label>
						<Textarea
							id="archive-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
							placeholder="e.g. Issued in error — replaced by INV-2026-0024"
							className="rounded-xl"
						/>
					</div>
				</div>

				<DialogFooter className="flex gap-2 border-t bg-muted/20 p-6">
					<DialogClose asChild>
						<Button variant="outline" className="rounded-xl font-bold" disabled={pending}>
							Keep Active
						</Button>
					</DialogClose>
					<Button
						onClick={() => onConfirm(reason)}
						disabled={pending}
						className="gap-2 rounded-xl bg-warning font-bold text-warning-foreground hover:bg-warning/90"
					>
						<Archive size={18} variant="Bold" />
						{pending ? "Archiving…" : "Archive Document"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
