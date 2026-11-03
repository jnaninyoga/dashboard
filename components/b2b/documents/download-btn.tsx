"use client";

import { useState } from "react";

import { useFlushDraft } from "@/components/b2b/documents/draft-save";
import { Button } from "@/components/ui/button";
import { getDocumentByIdAction } from "@/lib/actions/b2b/documents";
import { notify } from "@/lib/feedback/notify";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";

import { DocumentDownload } from "iconsax-reactjs";

import { B2BDocumentPDF } from "./document-pdf";

interface PDFDownloadBtnProps {
	doc: DocumentWithRelations;
	profile: BusinessProfile | null;
}

export function PDFDownloadBtn({ doc, profile }: PDFDownloadBtnProps) {
	const [isGenerating, setIsGenerating] = useState(false);
	const flushDraft = useFlushDraft();

	const isQuote = doc.type === "quote";
	const prefix = isQuote ? "Quote" : doc.type === "credit_note" ? "CreditNote" : "Invoice";

	// Ensure partner name is safe for filename
	const partnerName =
		doc.partner?.companyName?.replace(/[^a-z0-9]/gi, "_") || "Partner";
	const docName = `${prefix}_${partnerName}_${doc.documentNumber ?? "draft"}.pdf`;

	const handleDownload = async () => {
		try {
			setIsGenerating(true);

			// A draft prints as saved, with what she just typed: save it, read it back.
			let latest = doc;
			if (doc.status === "draft") {
				await flushDraft();
				latest = (await getDocumentByIdAction(doc.id)).document ?? doc;
			}

			// 1. Dynamically import the pdf builder to ensure no SSR issues
			const { pdf } = await import("@react-pdf/renderer");

			// 2. Generate the PDF Blob on the fly
			const blob = await pdf(
				<B2BDocumentPDF doc={latest} profile={profile} />,
			).toBlob();

			// 3. Create a temporary URL and trigger the browser download
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = docName;
			document.body.appendChild(link);
			link.click();

			// 4. Cleanup
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error generating PDF:", error);
			notify.error("Failed to generate PDF. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			onClick={handleDownload}
			disabled={isGenerating}
			variant="secondary"
			className="hover:zen-glow-blush gap-2 rounded-xl border border-secondary-2 font-medium shadow-sm transition-all"
		>
			<DocumentDownload size={18} />
			{isGenerating ? "Preparing PDF..." : "Download PDF"}
		</Button>
	);
}
