"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";
import { DocumentDownload } from "iconsax-reactjs";
import { B2BDocumentPDF } from "./document-pdf";
import { toast } from "sonner"; // Assuming you use sonner based on your action ribbon

interface PDFDownloadBtnProps {
	doc: DocumentWithRelations;
	profile: BusinessProfile | null;
}

export function PDFDownloadBtn({ doc, profile }: PDFDownloadBtnProps) {
	const [isGenerating, setIsGenerating] = useState(false);

	const isQuote = doc.type === "quote";
	const prefix = isQuote ? "Quote" : "Invoice";

	// Ensure partner name is safe for filename
	const partnerName =
		doc.partner?.companyName?.replace(/[^a-z0-9]/gi, "_") || "Partner";
	const docName = `${prefix}_${partnerName}_${doc.documentNumber}.pdf`;

	const handleDownload = async () => {
		try {
			setIsGenerating(true);

			// 1. Dynamically import the pdf builder to ensure no SSR issues
			const { pdf } = await import("@react-pdf/renderer");

			// 2. Generate the PDF Blob on the fly
			const blob = await pdf(
				<B2BDocumentPDF doc={doc} profile={profile} />,
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
			toast.error("Failed to generate PDF. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<Button
			onClick={handleDownload}
			disabled={isGenerating}
			variant="secondary"
			className="gap-2 rounded-xl font-medium shadow-sm border border-secondary-2 hover:zen-glow-blush transition-all"
		>
			<DocumentDownload size={18} />
			{isGenerating ? "Preparing PDF..." : "Download PDF"}
		</Button>
	);
}
