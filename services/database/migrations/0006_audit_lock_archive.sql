-- Race-safe sequential numbering. Read with SELECT … FOR UPDATE inside the
-- same transaction as the document insert.
CREATE TABLE "b2b_document_sequences" (
	"type" "b2b_document_type" NOT NULL,
	"year" integer NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "b2b_document_sequences_type_year_pk" PRIMARY KEY("type","year")
);
--> statement-breakpoint

-- Backfill the sequence table from existing documents so the next generated
-- number continues the live series (no gaps, no collisions).
INSERT INTO "b2b_document_sequences" ("type", "year", "next_value")
SELECT
	t.type,
	t.year,
	COALESCE(MAX(NULLIF(regexp_replace(d."document_number", '.*-', ''), '')::int), 0) + 1
FROM (
	SELECT DISTINCT
		d2."type" AS type,
		EXTRACT(YEAR FROM d2."issue_date")::int AS year
	FROM "b2b_documents" d2
) t
JOIN "b2b_documents" d
	ON d."type" = t.type
	AND EXTRACT(YEAR FROM d."issue_date")::int = t.year
GROUP BY t.type, t.year
ON CONFLICT ("type","year") DO NOTHING;
--> statement-breakpoint

-- Archive lifecycle. Issued documents are archived (soft-hidden) instead of
-- deleted, so the sequential number stays in the audit trail.
ALTER TABLE "b2b_documents" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "b2b_documents" ADD COLUMN "archived_reason" text;--> statement-breakpoint

-- One number per type+year, enforced by the database.
ALTER TABLE "b2b_documents" ADD CONSTRAINT "b2b_documents_document_number_unique" UNIQUE ("document_number");--> statement-breakpoint

-- A payment is always a positive amount.
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_amount_positive" CHECK ("amount" > 0);--> statement-breakpoint

-- Idempotency key for record-payment requests. Unique index already created by
-- the column-level UNIQUE; column is nullable so legacy rows are fine.
ALTER TABLE "b2b_payments" ADD COLUMN "request_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_request_id_unique" UNIQUE ("request_id");--> statement-breakpoint

-- A backorder line points back at the quote line it descends from. Block
-- accidental deletion of the quote line while children exist.
ALTER TABLE "b2b_document_lines" DROP CONSTRAINT "b2b_document_lines_source_line_id_b2b_document_lines_id_fk";--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_source_line_id_b2b_document_lines_id_fk" FOREIGN KEY ("source_line_id") REFERENCES "public"."b2b_document_lines"("id") ON DELETE RESTRICT ON UPDATE no action;--> statement-breakpoint

-- Hot path indexes.
CREATE INDEX "b2b_documents_archived_at_idx" ON "b2b_documents" ("archived_at") WHERE "archived_at" IS NULL;--> statement-breakpoint
CREATE INDEX "b2b_payments_document_date_idx" ON "b2b_payments" ("document_id", "payment_date" DESC);
