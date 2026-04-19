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
