import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	decimal,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
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
