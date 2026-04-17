"use client";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";

import { DocumentDownload } from "iconsax-reactjs";

import { B2BDocumentPDF } from "./document-pdf";

// Dynamically import PDFDownloadLink to prevent SSR issues
const PDFDownloadLink = dynamic(
	() => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
	{
		ssr: false,
		loading: () => (
			<Button
				disabled
				variant="secondary"
				className="gap-2 rounded-xl font-medium shadow-sm"
			>
				<DocumentDownload size={18} /> Loading PDF...
			</Button>
		),
	},
);

interface PDFDownloadBtnProps {
	doc: DocumentWithRelations;
	profile: BusinessProfile | null;
}

export function PDFDownloadBtn({ doc, profile }: PDFDownloadBtnProps) {
	const isQuote = doc.type === "quote";
	const prefix = isQuote ? "Quote" : "Invoice";

	// Ensure partner name is safe for filename
	const partnerName =
		doc.partner?.companyName?.replace(/[^a-z0-9]/gi, "_") || "Partner";
	const docName = `${prefix}_${partnerName}_${doc.documentNumber}.pdf`;

	return (
		<PDFDownloadLink
			document={<B2BDocumentPDF doc={doc} profile={profile} />}
			fileName={docName}
		>
			{({ loading }) => (
				<Button
					disabled={loading}
					variant="secondary"
					className="gap-2 rounded-xl font-medium shadow-sm border hover:zen-glow-blush transition-all"
				>
					<DocumentDownload size={18} />
					{loading ? "Preparing PDF..." : "Download PDF"}
				</Button>
			)}
		</PDFDownloadLink>
	);
}
