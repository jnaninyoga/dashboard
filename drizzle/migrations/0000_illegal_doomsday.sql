CREATE TYPE "public"."category" AS ENUM('adult', 'child', 'student');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."health_category" AS ENUM('physical', 'mental', 'lifestyle');--> statement-breakpoint
CREATE TYPE "public"."health_severity" AS ENUM('info', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('social_media', 'website', 'friend', 'professional_network', 'other');--> statement-breakpoint
CREATE TYPE "public"."slot_type" AS ENUM('group', 'private', 'outdoor');--> statement-breakpoint
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
	"note" text
);
--> statement-breakpoint
CREATE TABLE "client_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"discount_type" "discount_type" DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
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
	"activated_at" timestamp DEFAULT now(),
	"last_used_at" timestamp
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
	"category_id" uuid,
	"intake_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"photo_url" text
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
CREATE TABLE "membership_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"default_credits" integer NOT NULL,
	"duration_months" integer,
	"base_price" numeric(10, 2) NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
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
ALTER TABLE "client_wallets" ADD CONSTRAINT "client_wallets_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD CONSTRAINT "client_wallets_product_id_membership_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."membership_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_category_id_client_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."client_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;