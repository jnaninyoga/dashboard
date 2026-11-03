CREATE TYPE "public"."b2b_payment_method" AS ENUM('transfer', 'cheque', 'cash', 'card');--> statement-breakpoint
ALTER TABLE "b2b_documents" ALTER COLUMN "document_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "method" "b2b_payment_method";--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "reference" text;--> statement-breakpoint
-- Existing lines keep the order they were typed in: rows saved together share
-- one created_at, and were inserted in order, so their physical order breaks the tie.
UPDATE "b2b_document_lines" AS l
SET "position" = o.rn
FROM (
	SELECT "id", (row_number() OVER (PARTITION BY "document_id" ORDER BY "created_at", ctid) - 1)::integer AS rn
	FROM "b2b_document_lines"
) AS o
WHERE l."id" = o."id";
