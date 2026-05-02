import {
	b2bContacts,
	b2bDocumentLines,
	b2bDocuments,
	b2bPartners,
	b2bPayments,
	b2bPricingTiers,
} from "@/services/database/schema";

export type B2BPartner = typeof b2bPartners.$inferSelect;
export type B2BContact = typeof b2bContacts.$inferSelect;
export type B2BPricingTier = typeof b2bPricingTiers.$inferSelect;
export type B2BDocument = typeof b2bDocuments.$inferSelect;
export type B2BDocumentLine = typeof b2bDocumentLines.$inferSelect;
export type B2BPayment = typeof b2bPayments.$inferSelect;

export type B2BDocumentStatus =
	| "draft"
	| "sent"
	| "accepted"
	| "partially_paid"
	| "paid"
	| "cancelled";
export type B2BDocumentType = "quote" | "invoice";

export type Partner = B2BPartner;
export type Contact = B2BContact;
export type Document = B2BDocument;
export type DocumentLine = B2BDocumentLine;

export type PartnerWithRelations = Partner & {
	contacts?: Contact[];
	documents?: DocumentWithContact[];
};


export type ContactWithPartner = Contact & {
	partner?: Partner | null;
	documents?: Document[];
};
export type DocumentWithRelations = Document & {
	partner?: PartnerWithRelations | null;
	contact?: Contact | null;
	lines?: DocumentLine[];
	parent?: DocumentWithRelations | null;
	children?: DocumentWithRelations[];
	payments?: B2BPayment[];
};

export type DocumentWithContact = Document & {
	contact: Contact | null;
};

// --- Business Profile ---

export type StandardLegalLabel =
	| "ICE"
	| "IF"
	| "RC"
	| "Patente"
	| (string & {});

export type BusinessProfile = {
	id: string;
	companyName: string;
	email: string | null;
	phone: string | null;
	address: string | null;
	bankDetails: string | null;
	showBankDetails: boolean;
	legalDetails: { label: StandardLegalLabel; value: string }[] | null;
	logoBase64: string | null;
	signatureBase64: string | null;
	operator: string | null;
	updatedAt: Date;
};

export type NewBusinessProfile = Partial<BusinessProfile> & {
	companyName: string;
};
