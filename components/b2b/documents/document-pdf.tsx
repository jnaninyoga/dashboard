import React from "react";

import { formatCurrencyAmountToWords } from "@/lib/currency";
import type { BusinessProfile, DocumentWithRelations } from "@/lib/types/b2b";

import { Document, Font, Image as PdfImage,Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";

// --- Font Registration ---
Font.register({
    family: "Philosopher",
    fonts: [
        { src: "https://fonts.gstatic.com/s/philosopher/v21/vEFV2_5QCwIS4_Dhez5jcWBuT0g.ttf", fontWeight: 400 },
        { src: "https://fonts.gstatic.com/s/philosopher/v21/vEFI2_5QCwIS4_Dhez5jcWjValgb8tI.ttf", fontWeight: 700 },
    ],
});

Font.register({
    family: "Plus Jakarta Sans",
    fonts: [
        { src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_qU79TR_Q.ttf", fontWeight: 400 },
        { src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_d0n9TR_Q.ttf", fontWeight: 600 },
        { src: "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIbaomQNQcsA88c7O9yZ4KMCoOg4IA6-91aHEjcWuA_Tkn9TR_Q.ttf", fontWeight: 700 },
    ],
});

Font.register({
    family: "Great Vibes",
    fonts: [
        { src: "https://fonts.gstatic.com/s/greatvibes/v21/RWmMoKWR9v4ksMfaWd_JN9XFiaE.ttf" },
    ],
});

// --- Theme Colors ---
const COLORS = {
    primary: "#0f766e", // teal-700
    primaryLight: "#ccfbf1", // teal-50
    textMain: "#1e293b", // slate-800
    textMuted: "#64748b", // slate-500
    border: "#cbd5e1", // slate-300
    borderLight: "#e2e8f0", // slate-200
    bgHeader: "#f8fafc", // slate-50
};

// --- Styles ---
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Plus Jakarta Sans",
        fontSize: 10,
        color: COLORS.textMain,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: "auto",
        maxHeight: 60,
    },
    brandName: {
        fontFamily: "Philosopher",
        fontWeight: 700,
        fontSize: 22,
        color: COLORS.primary,
        marginBottom: 4,
    },
    companyInfo: {
        fontSize: 9,
        lineHeight: 1.4,
        color: COLORS.textMuted,
    },
    documentInfo: {
        alignItems: "flex-end",
    },
    docType: {
        fontFamily: "Philosopher",
        fontWeight: 700,
        fontSize: 28,
        color: COLORS.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    docNumber: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginBottom: 2,
    },
    dateLabel: {
        color: COLORS.textMuted,
        marginRight: 4,
    },
    dateValue: {
        fontWeight: 600,
    },
    partnerSection: {
        marginTop: 20,
        marginBottom: 30,
        padding: 16,
        backgroundColor: COLORS.bgHeader,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    partnerTitle: {
        fontSize: 9,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    partnerName: {
        fontFamily: "Philosopher",
        fontWeight: 700,
        fontSize: 16,
        marginBottom: 4,
    },
    partnerDetail: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    table: {
        width: "100%",
        marginTop: 20,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
        borderRadius: 6,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: COLORS.primaryLight,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerCell: {
        fontWeight: 700,
        color: COLORS.primary,
        fontSize: 9,
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    tableCell: {
        fontSize: 10,
        color: COLORS.textMain,
    },
    colDesc: { flex: 3 },
    colQty: { flex: 1, textAlign: "center" },
    colPrice: { flex: 1, textAlign: "right" },
    colTotal: { flex: 1, textAlign: "right", fontWeight: 600 },
    summaryContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },
    summaryBox: {
        width: 220,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    summaryLabel: {
        color: COLORS.textMuted,
    },
    summaryValue: {
        fontWeight: 600,
    },
    summaryRowTotal: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.primary,
    },
    totalLabel: {
        fontFamily: "Philosopher",
        fontWeight: 700,
        fontSize: 14,
        color: COLORS.primary,
    },
    totalValue: {
        fontWeight: 700,
        fontSize: 14,
        color: COLORS.primary,
    },
    amountInWordsText: {
        marginTop: 30,
        fontSize: 10,
        fontStyle: "italic",
    },
    bankDetailsContainer: {
        marginTop: 30,
        padding: 12,
        backgroundColor: COLORS.bgHeader,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: COLORS.borderLight,
    },
    bankDetailsTitle: {
        fontSize: 9,
        fontWeight: 700,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        marginBottom: 6,
    },
    signatureContainer: {
        marginTop: 40,
        alignItems: "flex-end",
    },
    signatureLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginBottom: 8,
    },
    signatureImage: {
        width: 140,
        height: "auto",
        maxHeight: 80,
    },
    footerContainer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: COLORS.borderLight,
        paddingTop: 8,
        alignItems: "center",
    },
    footerText: {
        fontSize: 8,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 1.4,
    },
    legalDetailsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        marginTop: 4,
        gap: 8,
    },
    legalItem: {
        fontSize: 8,
        color: COLORS.textMuted,
    },
    markdownBold: {
        fontWeight: 700,
    },
    markdownItalic: {
        fontStyle: "italic",
    },
});

// --- Simple Markdown Parser for <Text> ---
function parseMarkdown(text: string | null | undefined) {
    if (!text) return null;
    
    // Split by newlines first
    const lines = text.split("\n");
    
    return lines.map((line, lineIdx) => {
        // Very rudimentary parser: split by ** for bold
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <Text key={lineIdx} style={{ marginBottom: 2 }}>
                {parts.map((part, partIdx) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                            <Text key={partIdx} style={styles.markdownBold}>
                                {part.replace(/\*\*/g, "")}
                            </Text>
                        );
                    }
                    return <Text key={partIdx}>{part}</Text>;
                })}
            </Text>
        );
    });
}

// --- Component ---

interface B2BDocumentPDFProps {
    doc: DocumentWithRelations; 
    profile: BusinessProfile | null;
}

export function B2BDocumentPDF({ doc, profile }: B2BDocumentPDFProps) {
    const isQuote = doc.type === "quote";
    const title = isQuote ? "Devis" : "Facture";

    const issueDate = format(new Date(doc.issueDate), "dd/MM/yyyy");
    const dueDate = doc.dueDate ? format(new Date(doc.dueDate), "dd/MM/yyyy") : null;

    const totalWords = formatCurrencyAmountToWords(Number(doc.totalAmount));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        {profile?.logoBase64 ? (
                            <PdfImage src={profile.logoBase64} style={styles.logo} />
                        ) : (
                            <Text style={styles.brandName}>{profile?.companyName || "JnaninYoga"}</Text>
                        )}
                        <Text style={styles.companyInfo}>
                            {profile?.address}
                        </Text>
                        <Text style={styles.companyInfo}>
                            {profile?.email} {profile?.phone ? `| ${profile.phone}` : ""}
                        </Text>
                    </View>
                    <View style={styles.documentInfo}>
                        <Text style={styles.docType}>{title}</Text>
                        <Text style={styles.docNumber}>N° {doc.documentNumber}</Text>
                        
                        <View style={styles.dateRow}>
                            <Text style={styles.dateLabel}>Date:</Text>
                            <Text style={styles.dateValue}>{issueDate}</Text>
                        </View>
                        {dueDate ? (
                            <View style={styles.dateRow}>
                                <Text style={styles.dateLabel}>Échéance:</Text>
                                <Text style={styles.dateValue}>{dueDate}</Text>
                            </View>
                        ) : null}
                    </View>
                </View>

                {/* Client / Partner Section */}
                <View style={styles.partnerSection}>
                    <Text style={styles.partnerTitle}>Facturé à</Text>
                    <Text style={styles.partnerName}>{doc.partner?.companyName}</Text>
                    {doc.contact ? (
                        <Text style={styles.partnerDetail}>Attn: {doc.contact.fullName}</Text>
                    ) : null}
                    {doc.partner?.address ? (
                        <Text style={styles.partnerDetail}>{doc.partner.address}</Text>
                    ) : null}
                    {doc.partner?.taxId ? (
                        <Text style={styles.partnerDetail}>ICE: {doc.partner.taxId}</Text>
                    ) : null}
                </View>

                {/* Line Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.colDesc]}>Désignation</Text>
                        <Text style={[styles.headerCell, styles.colQty]}>Qté</Text>
                        <Text style={[styles.headerCell, styles.colPrice]}>Prix Unitaire</Text>
                        <Text style={[styles.headerCell, styles.colTotal]}>Total</Text>
                    </View>
                    {doc.lines?.map((line, i) => (
                        <View key={i} style={styles.tableRow}>
                            <Text style={[styles.tableCell, styles.colDesc]}>{line.description}</Text>
                            <Text style={[styles.tableCell, styles.colQty]}>{Number(line.quantity)}</Text>
                            <Text style={[styles.tableCell, styles.colPrice]}>
                                {Number(line.unitPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {Number(line.totalPrice).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totals Summary */}
                <View style={styles.summaryContainer}>
                    <View style={summaryBoxStyles.box}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Sous-total</Text>
                            <Text style={styles.summaryValue}>
                                {Number(doc.subtotal).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        {Number(doc.taxRate) > 0 ? (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>TVA {(Number(doc.taxRate) * 100).toFixed(0)}%</Text>
                                <Text style={styles.summaryValue}>
                                    {(Number(doc.totalAmount) - Number(doc.subtotal)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                                </Text>
                            </View>
                        ) : null}
                        <View style={styles.summaryRowTotal}>
                            <Text style={styles.totalLabel}>TOTAL MAD</Text>
                            <Text style={styles.totalValue}>
                                {Number(doc.totalAmount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                        {Number(doc.taxRate) === 0 ? (
                             <Text style={{ fontSize: 8, color: COLORS.textMuted, textAlign: "right", marginTop: 4 }}>
                                 TVA non applicable
                             </Text>
                        ) : null}
                    </View>
                </View>

                {/* Amount in words */}
                <Text style={styles.amountInWordsText}>
                    Arrêté {isQuote ? "le présent devis" : "la présente facture"} à la somme de : {"\n"}
                    <Text style={{ fontWeight: 600 }}>{totalWords}</Text>.
                </Text>

                {/* Bank Details */}
                {profile?.showBankDetails && profile.bankDetails ? (
                    <View style={styles.bankDetailsContainer}>
                        <Text style={styles.bankDetailsTitle}>Coordonnées Bancaires</Text>
                        {parseMarkdown(profile.bankDetails)}
                    </View>
                ) : null}

                {/* Signature */}
                {profile?.signatureBase64 ? (
                    <View style={styles.signatureContainer}>
                        <Text style={styles.signatureLabel}>Cachet & Signature:</Text>
                        <PdfImage src={profile.signatureBase64} style={styles.signatureImage} />
                    </View>
                ) : null}

                {/* Footer Section */}
                <View style={styles.footerContainer} fixed>
                    {profile?.documentFooterText ? parseMarkdown(profile.documentFooterText) : null}
                    
                    {profile?.legalDetails && Array.isArray(profile.legalDetails) ? (
                        <View style={styles.legalDetailsRow}>
                            {profile.legalDetails.map((detail, idx) => (
                                <View key={idx} style={{ flexDirection: "row" }}>
                                    <Text style={styles.legalItem}>
                                        {detail.label}: {detail.value}
                                    </Text>
                                    {(profile.legalDetails && idx < profile.legalDetails.length - 1) ? (
                                        <Text style={{ color: COLORS.border, marginHorizontal: 4 }}>|</Text>
                                    ) : null}
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </Page>
        </Document>
    );
}

const summaryBoxStyles = StyleSheet.create({
    box: {
        width: 220,
    }
});
