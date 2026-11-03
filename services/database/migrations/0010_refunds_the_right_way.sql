CREATE TYPE "public"."b2b_payment_kind" AS ENUM('payment', 'reversal', 'credit', 'refund');--> statement-breakpoint
ALTER TYPE "public"."b2b_document_type" ADD VALUE 'credit_note';--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "kind" "b2b_payment_kind" DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "receipt_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "reverses_payment_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "counterpart_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_reverses_payment_id_b2b_payments_id_fk" FOREIGN KEY ("reverses_payment_id") REFERENCES "public"."b2b_payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_counterpart_id_b2b_documents_id_fk" FOREIGN KEY ("counterpart_id") REFERENCES "public"."b2b_documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "b2b_payments" ADD CONSTRAINT "b2b_payments_reverses_payment_id_unique" UNIQUE("reverses_payment_id");--> statement-breakpoint
-- Payments recorded together (one receipt spread over a quotation's invoices)
-- were saved in one transaction: same created_at, same note. Each such group
-- becomes one receipt, so undoing it undoes all of its rows.
UPDATE "b2b_payments" AS p
SET "receipt_id" = g."rid"
FROM (
	SELECT "created_at", "notes", gen_random_uuid() AS "rid"
	FROM "b2b_payments"
	GROUP BY "created_at", "notes"
) AS g
WHERE p."created_at" = g."created_at" AND p."notes" IS NOT DISTINCT FROM g."notes";
