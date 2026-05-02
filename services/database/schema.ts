import { type StandardLegalLabel } from "@/lib/types/b2b";

import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	boolean,
	check,
	date,
	decimal,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const categoryEnum = pgEnum("category", ["adult", "child", "student"]);
export const genderEnum = pgEnum("gender", ["male", "female"]);
export const referralSourceEnum = pgEnum("referral_source", [
	"social_media",
	"website",
	"friend",
	"professional_network",
	"other",
]);
export const walletStatusEnum = pgEnum("wallet_status", [
	"active",
	"empty",
	"cancelled",
	"expired",
]);
export const slotTypeEnum = pgEnum("slot_type", [
	"group",
	"private",
	"outdoor",
	"b2b",
]);

export const healthCategoryEnum = pgEnum("health_category", [
	"physical", // (Body): Includes: Medical history, Surgery, Trauma, Medications, Current Pain
	"mental", // (Mind): Includes: Anxiety, Depression, Stress, Emotional Shock
	"lifestyle", // (Lifestyle): Includes: Sleep, Diet, Sports, Work posture
]);

export const healthSeverityEnum = pgEnum("health_severity", [
	"info",
	"warning",
	"critical",
]);

export const discountTypeEnum = pgEnum("discount_type", [
	"percentage",
	"fixed",
]);

export const b2bDocumentStatusEnum = pgEnum("b2b_document_status", [
	"draft",
	"sent",
	"accepted",
	"partially_paid",
	"paid",
	"cancelled",
]);

export const b2bDocumentTypeEnum = pgEnum("b2b_document_type", [
	"quote",
	"invoice",
]);

export const clients = pgTable("clients", {
	id: uuid("id").defaultRandom().primaryKey(),
	googleContactResourceName: text("google_contact_resource_name"),
	fullName: text("full_name").notNull(),
	email: text("email"),
	phone: text("phone").notNull(),
	address: text("address"),
	birthDate: date("birth_date").notNull(),
	gender: genderEnum("gender").notNull(),
	profession: text("profession"),
	consultationReason: text("consultation_reason"),
	referralSource: referralSourceEnum("referral_source"),
	// category: categoryEnum("category").notNull().default("adult"), // Deprecated
	categoryId: uuid("category_id").references(() => clientCategories.id), // New FK
	// Structured dossier for the detailed questionnaire
	intakeData: jsonb("intake_data"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	photoUrl: text("photo_url"),
});
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export const healthLogs = pgTable("health_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	clientId: uuid("client_id")
		.references(() => clients.id, { onDelete: "cascade" })
		.notNull(),
	category: healthCategoryEnum("category").notNull(),
	condition: text("condition").notNull(),
	treatment: text("treatment"),
	severity: healthSeverityEnum("severity").default("info").notNull(),
	isAlert: boolean("is_alert").default(false).notNull(),
	startDate: date("start_date").defaultNow().notNull(),
	endDate: date("end_date"), // Null = Permanent
});
export type HealthLog = typeof healthLogs.$inferSelect;
export type NewHealthLog = typeof healthLogs.$inferInsert;

export const membershipProducts = pgTable("membership_products", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	defaultCredits: integer("default_credits").notNull(),
	durationMonths: integer("duration_months"),
	basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
	isArchived: boolean("is_archived").default(false).notNull(),
});
export type MembershipProduct = typeof membershipProducts.$inferSelect;
export type NewMembershipProduct = typeof membershipProducts.$inferInsert;

export const clientCategories = pgTable("client_categories", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(), // e.g., "Student", "Adult"
	discountType: discountTypeEnum("discount_type")
		.notNull()
		.default("percentage"),
	discountValue: decimal("discount_value", { precision: 10, scale: 2 })
		.notNull()
		.default("0"),
	isArchived: boolean("is_archived").default(false).notNull(),
});
export type ClientCategory = typeof clientCategories.$inferSelect;
export type NewClientCategory = typeof clientCategories.$inferInsert;

export const appSettings = pgTable("app_settings", {
	key: text("key").primaryKey(), // e.g., 'discount_student'
	value: text("value").notNull(), // e.g., '20' (Percentage)
});

export const clientWallets = pgTable("client_wallets", {
	id: uuid("id").defaultRandom().primaryKey(),
	clientId: uuid("client_id")
		.references(() => clients.id, { onDelete: "cascade" })
		.notNull(),
	productId: uuid("product_id").references(() => membershipProducts.id),
	physicalCardRef: text("physical_card_ref"),
	remainingCredits: integer("remaining_credits").notNull(),
	status: walletStatusEnum("status").notNull().default("active"),
	amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }), // Actual amount paid after discount
	activatedAt: timestamp("activated_at").defaultNow(),
	lastUsedAt: timestamp("last_used_at"),
});
export type ClientWallet = typeof clientWallets.$inferSelect;
export type NewClientWallet = typeof clientWallets.$inferInsert;

export const attendanceLedger = pgTable("attendance_ledger", {
	id: uuid("id").defaultRandom().primaryKey(),
	walletId: uuid("wallet_id")
		.references(() => clientWallets.id, { onDelete: "cascade" })
		.notNull(),
	googleEventId: text("google_event_id"),
	checkInTime: timestamp("check_in_time").defaultNow().notNull(),
	slotType: slotTypeEnum("slot_type").notNull(),
	note: text("note"),
});
export type AttendanceLedger = typeof attendanceLedger.$inferSelect;
export type NewAttendanceLedger = typeof attendanceLedger.$inferInsert;

export const clientsRelations = relations(clients, ({ many, one }) => ({
	healthLogs: many(healthLogs),
	wallets: many(clientWallets),
	category: one(clientCategories, {
		fields: [clients.categoryId],
		references: [clientCategories.id],
	}),
}));

export const healthLogsRelations = relations(healthLogs, ({ one }) => ({
	client: one(clients, {
		fields: [healthLogs.clientId],
		references: [clients.id],
	}),
}));

export const clientWalletsRelations = relations(
	clientWallets,
	({ one, many }) => ({
		client: one(clients, {
			fields: [clientWallets.clientId],
			references: [clients.id],
		}),
		product: one(membershipProducts, {
			fields: [clientWallets.productId],
			references: [membershipProducts.id],
		}),
		ledgerEntries: many(attendanceLedger),
	}),
);

export const attendanceLedgerRelations = relations(
	attendanceLedger,
	({ one }) => ({
		wallet: one(clientWallets, {
			fields: [attendanceLedger.walletId],
			references: [clientWallets.id],
		}),
	}),
);

export const clientCategoriesRelations = relations(clientCategories, ({ many }) => ({
	clients: many(clients),
}));


// Store Google OAuth tokens for persistent access
export const userTokens = pgTable("user_tokens", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id").notNull().unique(), // Supabase auth user ID
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const b2bPricingTiers = pgTable("b2b_pricing_tiers", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(), // e.g., "Famille (3-5 pax)"
	price: integer("price").notNull(), // Price in MAD
	isArchived: boolean("is_archived").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type B2BPricingTier = typeof b2bPricingTiers.$inferSelect;
export type NewB2BPricingTier = typeof b2bPricingTiers.$inferInsert;

export const b2bPartners = pgTable("b2b_partners", {
	id: uuid("id").defaultRandom().primaryKey(),
	companyName: text("company_name").notNull(),
	address: text("address"),
	taxId: text("tax_id"), // 'ICE' in Morocco
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type B2BPartner = typeof b2bPartners.$inferSelect;
export type NewB2BPartner = typeof b2bPartners.$inferInsert;

export const b2bContacts = pgTable("b2b_contacts", {
	id: uuid("id").defaultRandom().primaryKey(),
	partnerId: uuid("partner_id")
		.references(() => b2bPartners.id, { onDelete: "cascade" })
		.notNull(),
	fullName: text("full_name").notNull(),
	role: text("role"), // e.g., 'Front Desk', 'Manager'
	email: text("email"),
	phone: text("phone"),
	isPrimary: boolean("is_primary").default(false).notNull(),
	googleContactResourceName: text("google_contact_resource_name"),
	googleEtag: text("google_etag"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type B2BContact = typeof b2bContacts.$inferSelect;
export type NewB2BContact = typeof b2bContacts.$inferInsert;

export const b2bDocuments = pgTable(
	"b2b_documents",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		partnerId: uuid("partner_id")
			.references(() => b2bPartners.id, { onDelete: "cascade" })
			.notNull(),
		contactId: uuid("contact_id").references(() => b2bContacts.id),
		type: b2bDocumentTypeEnum("type").notNull(),
		status: b2bDocumentStatusEnum("status").notNull().default("draft"),
		documentNumber: text("document_number").notNull(),
		issueDate: date("issue_date").notNull(),
		dueDate: date("due_date"),
		subtotal: decimal("subtotal", { precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		taxRate: decimal("tax_rate", { precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		totalAmount: decimal("total_amount", { precision: 10, scale: 2 })
			.notNull()
			.default("0"),
		notes: text("notes"),
		parentDocumentId: uuid("parent_document_id").references(
			(): AnyPgColumn => b2bDocuments.id,
		),
		archivedAt: timestamp("archived_at"),
		archivedReason: text("archived_reason"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		unique("b2b_documents_document_number_unique").on(t.documentNumber),
		index("b2b_documents_archived_at_idx")
			.on(t.archivedAt)
			.where(sql`${t.archivedAt} IS NULL`),
	],
);
export type B2BDocument = typeof b2bDocuments.$inferSelect;
export type NewB2BDocument = typeof b2bDocuments.$inferInsert;

// Race-safe sequential numbering. One row per (type, year).
// Updated with SELECT … FOR UPDATE inside the same transaction as the document insert.
export const b2bDocumentSequences = pgTable(
	"b2b_document_sequences",
	{
		type: b2bDocumentTypeEnum("type").notNull(),
		year: integer("year").notNull(),
		nextValue: integer("next_value").notNull().default(1),
	},
	(t) => [primaryKey({ columns: [t.type, t.year] })],
);

export const b2bDocumentLines = pgTable("b2b_document_lines", {
	id: uuid("id").defaultRandom().primaryKey(),
	documentId: uuid("document_id")
		.references(() => b2bDocuments.id, { onDelete: "cascade" })
		.notNull(),
	description: text("description").notNull(),
	quantity: decimal("quantity", { precision: 10, scale: 2 })
		.notNull()
		.default("1"),
	unitPrice: decimal("unit_price", { precision: 10, scale: 2 })
		.notNull()
		.default("0"),
	totalPrice: decimal("total_price", { precision: 10, scale: 2 })
		.notNull()
		.default("0"),
	sourceLineId: uuid("source_line_id").references(
		(): AnyPgColumn => b2bDocumentLines.id,
		{ onDelete: "restrict" },
	),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
export type B2BDocumentLine = typeof b2bDocumentLines.$inferSelect;
export type NewB2BDocumentLine = typeof b2bDocumentLines.$inferInsert;

export const b2bPayments = pgTable(
	"b2b_payments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		documentId: uuid("document_id")
			.references(() => b2bDocuments.id, { onDelete: "cascade" })
			.notNull(),
		amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
		paymentDate: timestamp("payment_date").defaultNow().notNull(),
		notes: text("notes"),
		// Idempotency key. Client sends a UUID per dialog open; unique index prevents
		// duplicate writes from double-submit. Nullable so backfilled rows are fine.
		requestId: uuid("request_id").unique(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at").defaultNow().notNull(),
	},
	(t) => [
		check("b2b_payments_amount_positive", sql`${t.amount} > 0`),
		index("b2b_payments_document_date_idx").on(
			t.documentId,
			t.paymentDate.desc(),
		),
	],
);

export type B2BPayment = typeof b2bPayments.$inferSelect;
export type NewB2BPayment = typeof b2bPayments.$inferInsert;

// Relations
export const b2bPartnersRelations = relations(b2bPartners, ({ many }) => ({
	contacts: many(b2bContacts),
	documents: many(b2bDocuments),
}));

export const b2bContactsRelations = relations(b2bContacts, ({ one, many }) => ({
	partner: one(b2bPartners, {
		fields: [b2bContacts.partnerId],
		references: [b2bPartners.id],
	}),
	documents: many(b2bDocuments),
}));

export const b2bDocumentsRelations = relations(
	b2bDocuments,
	({ one, many }) => ({
		partner: one(b2bPartners, {
			fields: [b2bDocuments.partnerId],
			references: [b2bPartners.id],
		}),
		contact: one(b2bContacts, {
			fields: [b2bDocuments.contactId],
			references: [b2bContacts.id],
		}),
		parent: one(b2bDocuments, {
			fields: [b2bDocuments.parentDocumentId],
			references: [b2bDocuments.id],
			relationName: "document_parent",
		}),
		children: many(b2bDocuments, {
			relationName: "document_parent",
		}),
		lines: many(b2bDocumentLines),
		payments: many(b2bPayments),
	}),
);

export const b2bPaymentsRelations = relations(b2bPayments, ({ one }) => ({
	document: one(b2bDocuments, {
		fields: [b2bPayments.documentId],
		references: [b2bDocuments.id],
	}),
}));

export const b2bDocumentLinesRelations = relations(
	b2bDocumentLines,
	({ one }) => ({
		document: one(b2bDocuments, {
			fields: [b2bDocumentLines.documentId],
			references: [b2bDocuments.id],
		}),
	}),
);

// --- Business Profile ---

export const businessProfiles = pgTable("business_profiles", {
	id: uuid("id").defaultRandom().primaryKey(),
	companyName: text("company_name").notNull(),
	email: text("email"),
	phone: text("phone"),
	address: text("address"),
	bankDetails: text("bank_details"), // Markdown string
	showBankDetails: boolean("show_bank_details").default(true).notNull(),
	legalDetails:
		jsonb("legal_details").$type<
			{ label: StandardLegalLabel; value: string }[]
		>(),
	logoBase64: text("logo_base64"),
	signatureBase64: text("signature_base64"),
	operator: text("operator"), // Name of the representative/operator
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
