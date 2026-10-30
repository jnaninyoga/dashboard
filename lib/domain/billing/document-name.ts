/** What a kind of document is called: "Quotation", "Invoice", "Credit note". */
export function documentKind(type: string) {
	return type === "credit_note" ? "Credit note" : type === "invoice" ? "Invoice" : "Quotation";
}

/**
 * What a document is called on screen: its number, or "Draft invoice" for an
 * invoice (or credit note) not issued yet: they're numbered when they're
 * issued, so the numbers follow the order of issue without gaps.
 */
export function documentName(doc: { type: string; documentNumber?: string | null }) {
	return doc.documentNumber ?? `Draft ${documentKind(doc.type).toLowerCase()}`;
}
