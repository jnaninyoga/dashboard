-- A membership card is a sale: her price then, the discount she gave, how
-- she was paid, and the last day the card can be used. Cards sold before
-- this keep empty fields (and no end: their buyers were never told one).
ALTER TYPE "public"."b2b_payment_method" RENAME TO "payment_method";--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "list_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "discount_name" text;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "discount_type" "discount_type";--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "discount_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "expires_on" date;
