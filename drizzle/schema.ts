import {
	pgTable,
	uuid,
	text,
	date,
	timestamp,
	integer,
	decimal,
	pgEnum,
	boolean,
	jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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

export const clients = pgTable("clients", {
	id: uuid("id").defaultRandom().primaryKey(),
	googleContactResourceName: text("google_contact_resource_name"),
	fullName: text("full_name").notNull(),
	email: text("email"),
	phone: text("phone").notNull(),
	address: text("address"),
	birthDate: date("birth_date").notNull(),
	gender: genderEnum("gender"),
	profession: text("profession"),
	consultationReason: text("consultation_reason"),
	referralSource: referralSourceEnum("referral_source"),
	category: categoryEnum("category").notNull().default("adult"),
	// Structured dossier for the detailed questionnaire
	intakeData: jsonb("intake_data"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthLogs = pgTable("health_logs", {
	id: uuid("id").defaultRandom().primaryKey(),
	clientId: uuid("client_id")
		.references(() => clients.id, { onDelete: "cascade" })
		.notNull(),
	category: healthCategoryEnum("category").notNull(),
	condition: text("condition").notNull(),
	severity: healthSeverityEnum("severity").default("info").notNull(),
	isAlert: boolean("is_alert").default(false).notNull(),
	startDate: date("start_date").defaultNow().notNull(),
	endDate: date("end_date"), // Null = Permanent
});

export const membershipProducts = pgTable("membership_products", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	defaultCredits: integer("default_credits").notNull(),
	basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
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
	activatedAt: timestamp("activated_at").defaultNow(),
	lastUsedAt: timestamp("last_used_at"),
});

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

export const clientsRelations = relations(clients, ({ many }) => ({
	healthLogs: many(healthLogs),
	wallets: many(clientWallets),
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
