CREATE TYPE "public"."b2b_document_status" AS ENUM('draft', 'sent', 'accepted', 'unpaid', 'partially_paid', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."b2b_document_type" AS ENUM('quote', 'invoice', 'credit_note');--> statement-breakpoint
CREATE TYPE "public"."b2b_payment_kind" AS ENUM('payment', 'reversal', 'credit', 'refund');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('adult', 'child', 'student');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."health_category" AS ENUM('physical', 'mental', 'lifestyle');--> statement-breakpoint
CREATE TYPE "public"."health_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('transfer', 'cheque', 'cash', 'card');--> statement-breakpoint
CREATE TYPE "public"."product_kind" AS ENUM('membership', 'partner_service');--> statement-breakpoint
CREATE TYPE "public"."product_unit" AS ENUM('session');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('social_media', 'website', 'friend', 'professional_network', 'other');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('group', 'private', 'outdoor', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."wallet_status" AS ENUM('active', 'empty', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_id" uuid NOT NULL,
	"google_event_id" text,
	"check_in_time" timestamp DEFAULT now() NOT NULL,
	"slot_type" "slot_type" NOT NULL,
	"note" text,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "b2b_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"role" text,
	"email" text,
	"phone" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"google_contact_resource_name" text,
	"google_etag" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_document_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"source_line_id" uuid,
	"product_id" uuid,
	"unit" "product_unit",
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_document_sequences" (
	"type" "b2b_document_type" NOT NULL,
	"year" integer NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "b2b_document_sequences_type_year_pk" PRIMARY KEY("type","year")
);
--> statement-breakpoint
CREATE TABLE "b2b_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"contact_id" uuid,
	"type" "b2b_document_type" NOT NULL,
	"status" "b2b_document_status" DEFAULT 'draft' NOT NULL,
	"document_number" text,
	"issue_date" date NOT NULL,
	"due_date" date,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"parent_document_id" uuid,
	"archived_at" timestamp,
	"archived_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "b2b_documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "b2b_partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"address" text,
	"tax_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"method" "payment_method",
	"reference" text,
	"kind" "b2b_payment_kind" DEFAULT 'payment' NOT NULL,
	"receipt_id" uuid,
	"reverses_payment_id" uuid,
	"counterpart_id" uuid,
	"reason" text,
	"notes" text,
	"request_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "b2b_payments_reverses_payment_id_unique" UNIQUE("reverses_payment_id"),
	CONSTRAINT "b2b_payments_request_id_unique" UNIQUE("request_id"),
	CONSTRAINT "b2b_payments_amount_positive" CHECK ("b2b_payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"bank_details" text,
	"show_bank_details" boolean DEFAULT true NOT NULL,
	"legal_details" jsonb,
	"logo_base64" text,
	"signature_base64" text,
	"operator" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"product_id" uuid,
	"physical_card_ref" text,
	"remaining_credits" integer NOT NULL,
	"status" "wallet_status" DEFAULT 'active' NOT NULL,
	"amount_paid" numeric(10, 2),
	"list_price" numeric(10, 2),
	"discount_name" text,
	"discount_type" "discount_type",
	"discount_value" numeric(10, 2),
	"payment_method" "payment_method",
	"payment_reference" text,
	"expires_on" date,
	"activated_at" timestamp DEFAULT now(),
	"last_used_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_contact_resource_name" text,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text NOT NULL,
	"address" text,
	"birth_date" date NOT NULL,
	"gender" "gender" NOT NULL,
	"profession" text,
	"consultation_reason" text,
	"referral_source" "referral_source",
	"discount_id" uuid,
	"intake_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"discount_type" "discount_type" DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"category" "health_category" NOT NULL,
	"condition" text NOT NULL,
	"treatment" text,
	"severity" "health_severity" DEFAULT 'info' NOT NULL,
	"is_alert" boolean DEFAULT false NOT NULL,
	"start_date" date DEFAULT now() NOT NULL,
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "product_kind" NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"credits" integer,
	"duration_months" integer,
	"unit" "product_unit",
	"group_min" integer,
	"group_max" integer,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_not_negative" CHECK ("products"."price" >= 0),
	CONSTRAINT "products_membership_has_credits" CHECK ("products"."kind" <> 'membership' OR "products"."credits" IS NOT NULL),
	CONSTRAINT "products_group_in_order" CHECK ("products"."group_min" IS NULL OR "products"."group_max" IS NULL OR "products"."group_min" <= "products"."group_max")
);
--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_event_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "slot_type" NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_sessions_google_event_id_unique" UNIQUE("google_event_id")
);
--> statement-breakpoint
CREATE TABLE "user_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tokens_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_ledger" ADD CONSTRAINT "attendance_ledger_wallet_id_client_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."client_wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_contacts" ADD CONSTRAINT "b2b_contacts_partner_id_b2b_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."b2b_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_document_id_b2b_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."b2b_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_source_line_id_b2b_document_lines_id_fk" FOREIGN KEY ("source_line_id") REFERENCES "public"."b2b_document_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_partner_id_b2b_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."b2b_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_contact_id_b2b_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."b2b_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_parent_document_id_b2b_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."b2b_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_document_id_b2b_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."b2b_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_reverses_payment_id_b2b_payments_id_fk" FOREIGN KEY ("reverses_payment_id") REFERENCES "public"."b2b_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_counterpart_id_b2b_documents_id_fk" FOREIGN KEY ("counterpart_id") REFERENCES "public"."b2b_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD CONSTRAINT "client_wallets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD CONSTRAINT "client_wallets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_discount_id_discounts_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "b2b_documents_archived_at_idx" ON "b2b_documents" USING btree ("archived_at") WHERE "b2b_documents"."archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "b2b_payments_document_date_idx" ON "b2b_payments" USING btree ("document_id","payment_date" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "studio_sessions_starts_at_idx" ON "studio_sessions" USING btree ("starts_at");