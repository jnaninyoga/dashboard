ALTER TYPE "public"."b2b_document_status" ADD VALUE 'partially_paid' BEFORE 'paid';--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD COLUMN "source_line_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD COLUMN "amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_source_line_id_b2b_document_lines_id_fk" FOREIGN KEY ("source_line_id") REFERENCES "public"."b2b_document_lines"("id") ON DELETE no action ON UPDATE no action;