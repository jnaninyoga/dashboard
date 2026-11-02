ALTER TABLE "client_wallets" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "client_wallets" ADD COLUMN "cancel_reason" text;