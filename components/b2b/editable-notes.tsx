"use client";

import { useState } from "react";

import { DocumentSection } from "@/components/b2b/documents/document-section";
import {
	SaveStatus,
	useAutosave,
} from "@/components/b2b/documents/use-autosave";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { updateDocumentNotesAction } from "@/lib/actions/b2b/documents";

interface EditableNotesProps {
	documentId: string;
	initialNotes: string | null;
	/** Only a draft's notes can change (an issued document is final). */
	readOnly?: boolean;
}

export function EditableNotes({
	documentId,
	initialNotes,
	readOnly = false,
}: EditableNotesProps) {
	const [notes, setNotes] = useState(initialNotes || "");

	// Notes save themselves as she types: no button to remember.
	const { state, changed, retry } = useAutosave(
		async () => {
			const res = await updateDocumentNotesAction(documentId, notes);
			return res.success
				? { ok: true }
				: {
						ok: false,
						message: (res.error ?? "couldn't reach the server").toLowerCase(),
					};
		},
		{ id: "notes", label: "Notes" },
	);

	if (readOnly && !notes) return null;

	return (
		<DocumentSection
			id="notes"
			title="Notes"
			aside={readOnly ? null : <SaveStatus state={state} retry={retry} />}
			className="animate-slide-up delay-200"
		>
			<MarkdownEditor
				value={notes}
				onChange={(e) => {
					setNotes(e.target.value);
					changed();
				}}
				placeholder="Add terms, bank details, or internal remarks..."
				readOnly={readOnly}
			/>
		</DocumentSection>
	);
}
