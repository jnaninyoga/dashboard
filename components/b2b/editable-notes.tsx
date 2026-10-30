"use client";

import { useState } from "react";

import { SaveStatus, useAutosave } from "@/components/b2b/documents/use-autosave";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { updateDocumentNotesAction } from "@/lib/actions/b2b/documents";

import { NoteText } from "iconsax-reactjs";

interface EditableNotesProps {
	documentId: string;
	initialNotes: string | null;
	/** Only a draft's notes can change (an issued document is final). */
	readOnly?: boolean;
}

export function EditableNotes({ documentId, initialNotes, readOnly = false }: EditableNotesProps) {
	const [notes, setNotes] = useState(initialNotes || "");

	// Notes save themselves as she types: no button to remember.
	const { state, changed, retry } = useAutosave(async () => {
		const res = await updateDocumentNotesAction(documentId, notes);
		return res.success ? { ok: true } : { ok: false, message: (res.error ?? "couldn't reach the server").toLowerCase() };
	});

	if (readOnly && !notes) return null;

	return (
		<div className="animate-slide-up bg-card rounded-3xl border p-6 shadow-sm delay-200">
			<div className="mb-4 flex h-10 items-center justify-between">
				<div className="flex items-center gap-2">
					<NoteText size={20} className="text-primary" variant="Bulk" />
					<h3 className="text-primary text-sm font-bold tracking-widest uppercase">Notes</h3>
				</div>
				{readOnly ? null : <SaveStatus state={state} retry={retry} />}
			</div>

			<MarkdownEditor
				value={notes}
				onChange={(e) => {
					setNotes(e.target.value);
					changed();
				}}
				placeholder="Add terms, bank details, or internal remarks..."
				disabled={readOnly}
				className="border-secondary/10"
			/>
		</div>
	);
}
