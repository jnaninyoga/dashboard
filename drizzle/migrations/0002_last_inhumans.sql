CREATE TYPE "public"."b2b_document_status" AS ENUM('draft', 'sent', 'accepted', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."b2b_document_type" AS ENUM('quote', 'invoice');--> statement-breakpoint
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" uuid NOT NULL,
	"contact_id" uuid,
	"type" "b2b_document_type" NOT NULL,
	"status" "b2b_document_status" DEFAULT 'draft' NOT NULL,
	"document_number" text NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"subtotal" numeric(10, 2) DEFAULT '0' NOT NULL,
	"tax_rate" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"parent_document_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "b2b_contacts" ADD CONSTRAINT "b2b_contacts_partner_id_b2b_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."b2b_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_document_id_b2b_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."b2b_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_partner_id_b2b_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."b2b_partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_contact_id_b2b_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."b2b_contacts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_parent_document_id_b2b_documents_id_fk" FOREIGN KEY ("parent_document_id") REFERENCES "public"."b2b_documents"("id") ON DELETE no action ON UPDATE no action;