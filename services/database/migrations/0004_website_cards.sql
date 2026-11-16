ALTER TABLE "products" ADD COLUMN "site_key" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "on_site" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "site_position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "popular" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_site_key_unique" UNIQUE("site_key");