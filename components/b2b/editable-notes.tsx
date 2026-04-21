"use client";

import { useState, useTransition } from "react";

import { updateDocumentNotesAction } from "@/lib/actions/b2b/documents";
import { Button } from "@/components/ui/button";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

import { NoteText, Save2 } from "iconsax-reactjs";
import { toast } from "sonner";

interface EditableNotesProps {
	documentId: string;
	initialNotes: string | null;
}

export function EditableNotes({
	documentId,
	initialNotes,
}: EditableNotesProps) {
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
		<div className="animate-slide-up bg-card rounded-3xl border p-6 shadow-sm delay-200">
			<div className="mb-4 flex h-10 items-center justify-between">
				<div className="flex items-center gap-2">
					<NoteText size={20} className="text-primary" variant="Bulk" />
					<h3 className="text-primary text-sm font-bold tracking-widest uppercase">
						Notes
					</h3>
				</div>
				{hasChanged ? (
					<Button
						onClick={handleSave}
						disabled={isPending}
						size="sm"
						className="zen-glow-teal h-8 gap-2 rounded-xl text-xs font-bold"
					>
						<Save2 size={14} variant="Bold" />
						Save Changes
					</Button>
				) : null}
			</div>

			<MarkdownEditor
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				placeholder="Add terms, bank details, or internal remarks..."
				disabled={isPending}
				className="border-secondary/10"
			/>
		</div>
	);
}
