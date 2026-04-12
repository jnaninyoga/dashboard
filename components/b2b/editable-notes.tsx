"use client";

import { useState, useTransition } from "react";
import { updateDocumentNotesAction } from "@/actions/b2b-documents";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NoteText, Save2 } from "iconsax-reactjs";

interface EditableNotesProps {
	documentId: string;
	initialNotes: string | null;
}

export function EditableNotes({ documentId, initialNotes }: EditableNotesProps) {
	const [notes, setNotes] = useState(initialNotes || "");
	const [isPending, startTransition] = useTransition();

	const handleSave = () => {
		startTransition(async () => {
			const res = await updateDocumentNotesAction(documentId, notes);
			if (res.success) {
				toast.success("Notes updated successfully");
			} else {
				toast.error(res.error || "Failed to update notes");
			}
		});
	};

	const hasChanged = notes !== (initialNotes || "");

	return (
		<div className="animate-slide-up delay-200 border-foreground/10 bg-card rounded-3xl border p-6 shadow-sm">
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<NoteText size={18} className="text-muted-foreground" />
					<h3 className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
						Notes & Remarks
					</h3>
				</div>
				{hasChanged && (
					<Button
						onClick={handleSave}
						disabled={isPending}
						size="sm"
						className="zen-glow-teal h-8 gap-2 rounded-xl text-xs font-bold"
					>
						<Save2 size={14} variant="Bold" />
						Save Changes
					</Button>
				)}
			</div>
			<Textarea
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				placeholder="Add terms, bank details, or internal remarks..."
				className="border-foreground/5 focus:ring-primary/20 min-h-[120px] bg-transparent leading-relaxed transition-all font-medium"
				disabled={isPending}
			/>
		</div>
	);
}
