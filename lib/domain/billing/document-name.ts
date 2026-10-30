/**
 * What a document is called on screen: its number, or "Draft invoice" for an
 * invoice not issued yet (invoices are numbered when they're issued, so the
 * numbers follow the order of issue without gaps).
 */
export function documentName(doc: { type: string; documentNumber?: string | null }) {
	return doc.documentNumber ?? (doc.type === "invoice" ? "Draft invoice" : "Draft quotation");
}
