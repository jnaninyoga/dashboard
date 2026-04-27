import React, { memo } from "react";
import ReactMarkdown from "react-markdown";

import type { BusinessProfile, DocumentLine, DocumentWithRelations } from "@/lib/types/b2b";
import { formatCurrencyAmountToWords } from "@/lib/utils/currency";

import {
	Document,
	Font,
	Image as PdfImage,
	Link,
	Page,
	Path,
	StyleSheet,
	Svg,
	Text,
	View,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import remarkGfm from "remark-gfm";

// ─── Font Registration ────────────────────────────────────────────────────────

Font.register({
	family: "Philosopher",
	fonts: [
		{
			src: "https://fonts.gstatic.com/s/philosopher/v21/vEFV2_5QCwIS4_Dhez5jcVBp.ttf",
			fontWeight: 400,
		},
		{
			src: "https://fonts.gstatic.com/s/philosopher/v21/vEFX2_5QCwIS4_Dhez5jcWBrT0g.ttf",
			fontWeight: 400,
			fontStyle: "italic",
		},
		{
			src: "https://fonts.gstatic.com/s/philosopher/v21/vEFI2_5QCwIS4_Dhez5jcWjVamgc.ttf",
			fontWeight: 700,
		},
		{
			src: "https://fonts.gstatic.com/s/philosopher/v21/vEFK2_5QCwIS4_Dhez5jcWBrd_QZ8tI.ttf",
			fontWeight: 700,
			fontStyle: "italic",
		},
	],
});

Font.register({
	family: "Plus Jakarta Sans",
	fonts: [
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU7NSg.ttf",
			fontWeight: 400,
		},
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIZaomQNQcsA88c7O9yZ4KMCoOg4KozySKCdSNG9OcqYQ0lCR_Q.ttf",
			fontWeight: 400,
			fontStyle: "italic",
		},
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0nNSg.ttf",
			fontWeight: 600,
		},
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIZaomQNQcsA88c7O9yZ4KMCoOg4KozySKCdSNG9OcqYQ37Dh_Q.ttf",
			fontWeight: 600,
			fontStyle: "italic",
		},
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_TknNSg.ttf",
			fontWeight: 700,
		},
		{
			src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIZaomQNQcsA88c7O9yZ4KMCoOg4KozySKCdSNG9OcqYQ3CDh_Q.ttf",
			fontWeight: 700,
			fontStyle: "italic",
		},
	],
});

Font.register({
	family: "Great Vibes",
	fonts: [
		{
			src: "https://fonts.gstatic.com/s/greatvibes/v21/RWmMoKWR9v4ksMfaWd_JN-XC.ttf",
			fontWeight: 400,
		},
	],
});

// ─── Design Tokens ────────────────────────────────────────────────────────────

const C = {
	primary: "#1d7e8e", // Teal
	primaryLight: "#d5eff2",
	blushBg: "#fbeceb", // Soft pink table header
	blushText: "#8a3b3c", // Dark red/burgundy
	text: "#333333", // Dark gray body text
	muted: "#6b7280",
	border: "#e5e7eb",
	white: "#ffffff",
} as const;

// ─── Custom Bulk Icons ────────────────────────────────────────────────────────

const IconEditBulk = memo(({ size = 14, color = C.primary }: { size?: number; color?: string }) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
		<Path
			opacity={0.4}
			d="M22 10.5V15c0 5-2 7-7 7H9c-5 0-7-2-7-7V9c0-5 2-7 7-7h4.5"
			fill={color}
		/>
		<Path
			d="M21.02 2.98c-1.79-1.8-3.54-.04-3.54-.04l-7.79 7.78c-.28.28-.55.83-.6 1.22l-.39 2.76c-.14 1 .59 1.72 1.59 1.59l2.76-.39c.39-.05.94-.32 1.22-.6l7.78-7.79s1.76-1.75-.03-3.53z"
			fill={color}
		/>
	</Svg>
));
IconEditBulk.displayName = "IconEditBulk";


const IconBankBulk = memo(({ size = 14, color = C.primary }: { size?: number; color?: string }) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
		<Path opacity={0.4} d="M4 10h16v8H4z" fill={color} />
		<Path d="M2 22h20v-2H2v2zM12 2L2 7v2h20V7L12 2z" fill={color} />
	</Svg>
));
IconBankBulk.displayName = "IconBankBulk";


const LotusCustomSvg = memo(({ style }: { style?: React.ComponentProps<typeof Svg>["style"] }) => (



	<Svg viewBox="42.5 105.5 340.2 213.6" style={style}>
		{/* Dark Blush Petals */}
		<Path
			d="M295.823,243.943c-31.718,31.718-83.223,31.64-83.223,31.64s-0.079-51.505,31.639-83.223 s83.223-31.639,83.223-31.639S327.541,212.225,295.823,243.943z"
			fill="rgb(245, 202, 199)"
		/>
		<Path
			d="M180.961,192.359c31.718,31.718,31.639,83.223,31.639,83.223s-51.504,0.079-83.223-31.64 s-31.64-83.223-31.64-83.223S149.243,160.641,180.961,192.359z"
			fill="rgb(245, 202, 199)"
		/>
		<Path
			d="M131.38,239.107c44.856,0,81.22,36.475,81.22,36.475s-36.363,36.475-81.22,36.475 s-81.22-36.475-81.22-36.475S86.524,239.107,131.38,239.107z"
			fill="rgb(245, 202, 199)"
		/>
		<Path
			d="M293.82,312.058c-44.856,0-81.22-36.475-81.22-36.475s36.363-36.475,81.22-36.475 s81.22,36.475,81.22,36.475S338.676,312.058,293.82,312.058z"
			fill="rgb(245, 202, 199)"
		/>
		<Path
			d="M249.075,194.363c0,44.856-36.475,81.22-36.475,81.22s-36.475-36.363-36.475-81.22 c0-44.857,36.475-81.22,36.475-81.22S249.075,149.506,249.075,194.363z"
			fill="rgb(245, 202, 199)"
		/>

		{/* Light Blush Outlines / Petals */}
		<Path
			d="M212.604,282.583c-0.003,0-0.011,0-0.014,0c-3.858-0.006-6.984-3.131-6.99-6.989 c-0.003-2.222,0.3-54.794,33.689-88.184c33.307-33.307,85.944-33.689,88.169-33.689c3.862,0,6.998,3.127,7.004,6.989 c0.003,2.222-0.301,54.794-33.69,88.183C267.465,282.2,214.828,282.583,212.604,282.583z M320.045,168.149 c-14.795,1.333-48.493,6.796-70.856,29.16c-22.434,22.434-27.86,56.061-29.172,70.844c14.801-1.333,48.494-6.798,70.856-29.16 C313.307,216.56,318.733,182.932,320.045,168.149z"
			fill="rgb(253, 233, 231)"
		/>
		<Path
			d="M212.61,282.583c-0.003,0-0.01,0-0.014,0c-2.224,0-54.861-0.383-88.168-33.69 c-33.389-33.389-33.693-85.961-33.69-88.183c0.006-3.858,3.132-6.984,6.99-6.989c2.238,0,54.876,0.383,88.183,33.689 c33.389,33.389,33.693,85.962,33.689,88.184C219.594,279.451,216.468,282.577,212.61,282.583z M105.168,168.151 c1.335,14.803,6.803,48.486,29.159,70.842s56.037,27.824,70.843,29.159c-1.335-14.803-6.802-48.486-29.159-70.843 S119.974,169.486,105.168,168.151z"
			fill="rgb(253, 233, 231)"
		/>
		<Path
			d="M131.38,319.058c-47.219,0-84.608-36.959-86.177-38.533c-2.723-2.732-2.723-7.153,0-9.885 c1.569-1.573,38.958-38.533,86.177-38.533s84.608,36.959,86.177,38.533c2.723,2.732,2.723,7.153,0,9.885 C215.989,282.098,178.6,319.058,131.38,319.058z M60.659,275.574c11.404,9.52,39.095,29.483,70.722,29.483 c31.726,0,59.341-19.941,70.722-29.467c-11.404-9.52-39.095-29.483-70.722-29.483C99.654,246.107,72.039,266.048,60.659,275.574z"
			fill="rgb(253, 233, 231)"
		/>
		<Path
			d="M293.82,319.058c-47.219,0-84.608-36.959-86.177-38.533c-2.723-2.732-2.723-7.153,0-9.885 c1.569-1.573,38.958-38.533,86.177-38.533s84.608,36.959,86.177,38.533c2.723,2.732,2.723,7.153,0,9.885 C378.428,282.098,341.039,319.058,293.82,319.058z M223.098,275.574c11.404,9.52,39.095,29.483,70.722,29.483 c31.726,0,59.341-19.941,70.722-29.467c-11.404-9.52-39.095-29.483-70.722-29.483 C262.094,246.107,234.479,266.048,223.098,275.574z"
			fill="rgb(253, 233, 231)"
		/>
		<Path
			d="M212.6,282.583c-1.788,0-3.576-0.681-4.942-2.042c-1.573-1.569-38.533-38.958-38.533-86.177 c0-47.22,36.959-84.609,38.533-86.178c2.732-2.724,7.152-2.724,9.885,0c1.573,1.569,38.533,38.958,38.533,86.178 c0,47.219-36.959,84.608-38.533,86.177C216.176,281.902,214.388,282.583,212.6,282.583z M212.608,123.641 c-9.52,11.404-29.483,39.095-29.483,70.722c0,31.726,19.941,59.341,29.467,70.722c9.522-11.409,29.483-39.098,29.483-70.722 C242.075,162.637,222.134,135.021,212.608,123.641z"
			fill="rgb(253, 233, 231)"
		/>
	</Svg>
));
LotusCustomSvg.displayName = "LotusCustomSvg";


// ─── Markdown Parser ──────────────────────────────────────────────────────────

// ─── Markdown Parser (React-PDF compatible) ──────────────────────────────────

const PDFMarkdown = memo(({ children }: { children: string | null | undefined }) => {
	if (!children) return null;

	return (
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			components={{
				// Use View/Text for wrapping rather than div/p
				p: ({ children }) => <Text style={{ marginBottom: 4 }}>{children}</Text>,
				strong: ({ children }) => <Text style={{ fontWeight: 700 }}>{children}</Text>,
				em: ({ children }) => <Text style={{ fontStyle: "italic" }}>{children}</Text>,
				h3: ({ children }) => (
					<Text
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: C.primary,
							marginTop: 8,
							marginBottom: 4,
						}}
					>
						{children}
					</Text>
				),
				ul: ({ children }) => <View style={{ marginLeft: 8, marginBottom: 4 }}>{children}</View>,
				li: ({ children }) => (
					<View style={{ flexDirection: "row", marginBottom: 2 }}>
						<Text style={{ width: 8, fontSize: 10 }}>•</Text>
						<Text style={{ flex: 1 }}>{children}</Text>
					</View>
				),
			}}
		>
			{children}
		</ReactMarkdown>
	);
});
PDFMarkdown.displayName = "PDFMarkdown";


// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
	page: {
		padding: 0,
		fontFamily: "Plus Jakarta Sans",
		fontSize: 10,
		color: C.text,
		backgroundColor: C.white,
		position: "relative",
	},

	// Decorative Wings - Moved to background container for stability
	backgroundLayer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -1,
	},
	wingTopRight: {
		position: "absolute",
		top: -20,
		right: -20,
		width: 180,
		opacity: 0.1,
		transform: "scaleX(-1) scaleY(-1)",
	},
	wingBottomLeft: {
		position: "absolute",
		bottom: -30,
		left: -40,
		width: 320,
		opacity: 0.1,
	},

	contentWrapper: {
		paddingTop: 50,
		paddingHorizontal: 50,
		paddingBottom: 50,
		// Removed height: "100%" entirely to fix the infinite loop crash
	},

	// ── Header Zone ──
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 20,
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		maxWidth: "60%",
	},
	logo: {
		width: 80,
		height: 80,
		marginRight: 15,
	},
	operatorName: {
		fontFamily: "Philosopher",
		fontSize: 22,
		color: "#000",
		marginBottom: 4,
	},
	brandName: {
		fontSize: 11,
		fontWeight: 700,
		color: C.primary,
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 6,
	},
	legalText: {
		fontSize: 9,
		color: C.muted,
		lineHeight: 1.4,
	},

	headerRight: {
		alignItems: "flex-end",
		paddingTop: 10,
	},
	docTitleVibes: {
		fontFamily: "Great Vibes",
		fontSize: 46,
		color: C.primary,
		lineHeight: 1,
		marginBottom: 10,
	},
	docNumPill: {
		backgroundColor: C.primaryLight,
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 6,
	},
	docNumText: {
		fontSize: 9,
		fontWeight: 700,
		color: C.primary,
		letterSpacing: 0.5,
	},

	// ── Divider ──
	divider: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 35,
		marginTop: 10,
	},
	line: {
		flex: 1,
		height: 1,
		backgroundColor: C.border,
	},
	lotusCenter: {
		width: 35,
		height: 35,
		marginHorizontal: 15,
	},

	// ── Meta Info (Issued To & Dates) ──
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 40,
	},
	issuedToTitle: {
		fontSize: 10,
		fontWeight: 700,
		color: "#000",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
	},
	clientText: {
		fontSize: 10,
		color: C.text,
		lineHeight: 1.5,
	},
	datesBox: {
		alignItems: "flex-end",
	},
	dateLine: {
		flexDirection: "row",
		marginBottom: 6,
	},
	dateLabel: {
		fontSize: 10,
		color: C.muted,
		width: 70,
		textAlign: "right",
		letterSpacing: 1,
	},
	dateValue: {
		fontSize: 10,
		color: C.text,
		width: 80,
		textAlign: "right",
	},

	// ── Table ──
	table: {
		marginBottom: 40,
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: C.blushBg,
		borderRadius: 20,
		paddingVertical: 12,
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	th: {
		fontSize: 9,
		fontWeight: 700,
		color: C.blushText,
		letterSpacing: 1,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	td: {
		fontSize: 10,
		color: C.text,
	},
	colDesc: { flex: 4 },
	colPrice: { flex: 1.5, textAlign: "center" },
	colQty: { flex: 1, textAlign: "center" },
	colTotal: { flex: 1.5, textAlign: "right" },

	// ── Bottom Section Layout ──
	bottomLeft: {
		flex: 1,
		paddingRight: 30,
	},
	bottomRight: {
		width: 220,
	},
	bottomRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10, // Reduced from 20
	},
	sectionTitleBox: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	sectionTitle: {
		fontFamily: "Plus Jakarta Sans",
		fontSize: 14,
		color: C.primary,
		marginLeft: 6,
	},
	noteText: {
		fontSize: 10,
		color: C.text,
		lineHeight: 1.5,
		marginBottom: 30,
	},
	bankText: {
		fontSize: 10,
		color: C.text,
		lineHeight: 1.4,
	},

	// ── Sign Off Row (Bank Details + Signature) ──
	signOffRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start", // Changed from flex-end for better top-baseline control
		paddingTop: 12,
		borderTop: 1,
		borderColor: C.border,
		marginTop: 5,
	},
	bankDetailsBox: {
		flex: 1.5,
		paddingRight: 30,
	},
	totalsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 6,
		paddingHorizontal: 15,
	},
	totalsLabel: {
		fontSize: 10,
		fontWeight: 700,
		color: C.text,
		letterSpacing: 0.5,
	},
	totalsValue: {
		fontSize: 10,
		fontWeight: 700,
		color: C.text,
	},
	grandTotalPill: {
		flexDirection: "row",
		justifyContent: "space-between",
		backgroundColor: C.primary,
		borderRadius: 20,
		paddingVertical: 12,
		paddingHorizontal: 15,
		marginTop: 8,
	},
	grandTotalLabel: {
		fontSize: 11,
		fontWeight: 700,
		color: C.white,
		letterSpacing: 1,
	},
	grandTotalValue: {
		fontSize: 11,
		fontWeight: 700,
		color: C.white,
	},
	amountWords: {
		fontFamily: "Philosopher",
		fontSize: 11,
		color: C.blushText,
		textAlign: "right",
		marginTop: 15,
		fontStyle: "italic",
	},

	// ── Sign Off ──
	thankYou: {
		fontFamily: "Great Vibes",
		fontSize: 18,
		fontWeight: 500,
		color: C.primary,
		letterSpacing: 1,
		marginTop: -4, // Counter-act the script font's natural top-offset for better baseline match
		textTransform: "capitalize",
	},
	signOffBox: {
		alignItems: "flex-end",
	},
	signatureImg: {
		width: 120,
		marginTop: 8,
	},

	// ── Footer ──
	footer: {
		position: "absolute",
		bottom: 30,
		left: 50,
		right: 50,
		borderTop: 1,
		borderColor: C.border,
		paddingTop: 12,
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap", // Added for long addresses
		gap: 12,
	},
	footerText: {
		fontSize: 8,
		color: C.muted,
		letterSpacing: 0.3,
	},
	footerDot: {
		color: C.primary,
		fontSize: 10,
		fontWeight: 700,
		opacity: 0.6,
		marginHorizontal: 4,
	},
});

// ─── Component ────────────────────────────────────────────────────────────────

interface B2BDocumentPDFProps {
	doc: DocumentWithRelations;
	profile: BusinessProfile | null;
}

export const B2BDocumentPDF = memo(({ doc, profile }: B2BDocumentPDFProps) => {
	const isQuote = doc.type === "quote";
	const title = isQuote ? "Devis" : "Facture";
	const issueDate = format(new Date(doc.issueDate), "dd/MM/yyyy");
	const dueDate = doc.dueDate
		? format(new Date(doc.dueDate), "dd/MM/yyyy")
		: null;

	// Formatting currency without symbol inside the grid, add MAD to totals
	const formatNum = (amount: number | string) => {
		return Number(amount)
			.toLocaleString("fr-FR", {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2,
			})
			.replace(/[\s\u202F\u00A0]/g, " ");
	};

	const totalAmount = Number(doc.totalAmount);
	const subtotal = Number(doc.subtotal);
	const taxRate = Number(doc.taxRate);
	const hasTax = taxRate > 0;
	const taxAmount = totalAmount - subtotal;

	const totalWords = formatCurrencyAmountToWords(totalAmount);

	const hasBankDetails = profile?.showBankDetails && !!profile.bankDetails;
	const hasSignature = !!profile?.signatureBase64;

	return (
		<Document>
			<Page size="A4" style={S.page}>
				{/* Background Decorative Wings Layer (Fixed) */}
				<View style={S.backgroundLayer} fixed>
					<PdfImage src="/assets/imgs/doc-wing.png" style={S.wingTopRight} />
					<PdfImage src="/assets/imgs/doc-wing.png" style={S.wingBottomLeft} />
				</View>

				<View style={S.contentWrapper}>
					{/* ── Header ── */}
					<View style={S.headerRow}>
						<View style={S.headerLeft}>
							{profile?.logoBase64 ? (
								<PdfImage src={profile.logoBase64} style={S.logo} />
							) : null}

							<View>
								<Text style={S.operatorName}>
									{profile?.operator || "Ouarda El Fahli"}
								</Text>
								<Text style={S.brandName}>
									{profile?.companyName ?? "JNANINYOGA STUDIO"}
								</Text>
								{profile?.legalDetails?.map((detail, idx) => (
									<Text key={idx} style={S.legalText}>
										<Text style={{ color: C.primary }}>{detail.label}: </Text>
										{detail.value}
									</Text>
								))}
							</View>
						</View>

						<View style={S.headerRight}>
							<Text style={S.docTitleVibes}>{title}</Text>
							<View style={S.docNumPill}>
								<Text style={S.docNumText}>N° {doc.documentNumber}</Text>
							</View>
							{doc.parent && doc.type === "invoice" ? (
								<Text
									style={{
										fontSize: 8,
										color: C.muted,
										marginTop: 6,
										letterSpacing: 0.4,
									}}
								>
									Reliquat du devis N° {doc.parent.documentNumber}
								</Text>
							) : null}
						</View>
					</View>

					{/* ── Divider ── */}
					<View style={S.divider}>
						<View style={S.line} />
						<LotusCustomSvg style={S.lotusCenter} />
						<View style={S.line} />
					</View>

					{/* ── Meta Info ── */}
					<View style={S.metaRow}>
						<View>
							<Text style={S.issuedToTitle}>ADRESSÉ À :</Text>
							<Text style={S.clientText}>{doc.partner?.companyName}</Text>
							{doc.contact ? (
								<Text style={S.clientText}>{doc.contact.fullName}</Text>
							) : null}
							{doc.partner?.taxId ? (
								<Text style={S.clientText}>ICE: {doc.partner.taxId}</Text>
							) : null}
							{doc.partner?.address ? (
								<Text style={S.clientText}>{doc.partner.address}</Text>
							) : null}

						</View>
						<View style={S.datesBox}>
							<View style={S.dateLine}>
								<Text style={S.dateLabel}>DATE :</Text>
								<Text style={S.dateValue}>{issueDate}</Text>
							</View>
							{dueDate ? (
								<View style={S.dateLine}>
									<Text style={S.dateLabel}>ÉCHÉANCE :</Text>
									<Text style={S.dateValue}>{dueDate}</Text>
								</View>
							) : null}
						</View>

					</View>

					{/* ── Table ── */}
					<View style={S.table}>
						<View style={S.tableHeader}>
							<Text style={[S.th, S.colDesc]}>DÉSIGNATION</Text>
							<Text style={[S.th, S.colPrice]}>PRIX UNITAIRE</Text>
							<Text style={[S.th, S.colQty]}>QTÉ</Text>
							<Text style={[S.th, S.colTotal]}>TOTAL</Text>
						</View>

						{doc.lines?.map((line: DocumentLine, i: number) => (
							<View key={i} style={S.tableRow} wrap={false}>
								<Text style={[S.td, S.colDesc]}>{line.description}</Text>
								<Text style={[S.td, S.colPrice]}>
									{formatNum(line.unitPrice)} MAD
								</Text>
								<Text style={[S.td, S.colQty]}>{Number(line.quantity)}</Text>
								<Text style={[S.td, S.colTotal]}>
									{formatNum(line.totalPrice)} MAD
								</Text>
							</View>
						))}
					</View>

					{/* ── Bottom Section ── */}
					<View style={S.bottomRow}>
						{/* Notes */}
						<View style={S.bottomLeft}>
							{doc.notes ? (
								<View>
									<View style={S.sectionTitleBox}>
										<IconEditBulk size={16} />
										<Text style={S.sectionTitle}>Note</Text>
									</View>
									<Text style={S.noteText}>{doc.notes}</Text>
								</View>
							) : null}
						</View>


						{/* Totals — Morocco audit convention: TOTAL HT / TVA / TOTAL TTC */}
						<View style={S.bottomRight}>
							<View style={S.totalsRow}>
								<Text style={S.totalsLabel}>TOTAL HT</Text>
								<Text style={S.totalsValue}>{formatNum(subtotal)} MAD</Text>
							</View>
							{hasTax ? (
								<View style={S.totalsRow}>
									<Text style={S.totalsLabel}>TVA ({taxRate}%)</Text>
									<Text style={S.totalsValue}>{formatNum(taxAmount)} MAD</Text>
								</View>
							) : null}


							<View style={S.grandTotalPill}>
								<Text style={S.grandTotalLabel}>TOTAL TTC</Text>
								<Text style={S.grandTotalValue}>
									{formatNum(totalAmount)} MAD
								</Text>
							</View>

							<Text style={S.amountWords}>{totalWords}</Text>
						</View>
					</View>

					{/* ── Sign-off Row (Bank + Signature) ── */}
					{hasBankDetails || hasSignature ? (
						<View style={S.signOffRow} wrap={false}>
							<View style={S.bankDetailsBox}>
								{hasBankDetails ? (
									<>
										<View style={S.sectionTitleBox}>
											<IconBankBulk size={16} />
											<Text style={S.sectionTitle}>Coordonnées Bancaires</Text>
										</View>
										<View style={S.bankText}>
											<PDFMarkdown>{profile.bankDetails}</PDFMarkdown>
										</View>
									</>
								) : null}
							</View>

							<View style={S.signOffBox}>
								{hasSignature ? (
									<>
										<Text style={S.thankYou}>Merci</Text>
										<PdfImage src={profile.signatureBase64!} style={S.signatureImg} />
									</>
								) : null}
							</View>
						</View>
					) : null}

				</View>

				{/* ── Footer ── */}
				<View style={S.footer} fixed>
					{profile?.address ? <Text style={S.footerText}>{profile.address}</Text> : null}

					{profile?.phone ? (
						<>
							<Text style={S.footerDot}>•</Text>
							<Link src={`tel:${profile.phone.replace(/\s+/g, "")}`} style={{ textDecoration: "none" }}>
								<Text style={S.footerText}>{profile.phone}</Text>
							</Link>
						</>
					) : null}

					{profile?.email ? (
						<>
							<Text style={S.footerDot}>•</Text>
							<Link src={`mailto:${profile.email}`} style={{ textDecoration: "none" }}>
								<Text style={S.footerText}>{profile.email}</Text>
							</Link>
						</>
					) : null}
				</View>

			</Page>
		</Document>
	);
});
B2BDocumentPDF.displayName = "B2BDocumentPDF";

