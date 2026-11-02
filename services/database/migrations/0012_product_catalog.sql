-- One price list for what she sells: membership cards to clients, and
-- services to partners, priced per session for a group of a given size.
-- Memberships and partner rates move into it with their ids, so the cards
-- already sold still point at what they were sold as.
CREATE TYPE "public"."product_kind" AS ENUM('membership', 'partner_service');--> statement-breakpoint
CREATE TYPE "public"."product_unit" AS ENUM('session');--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "product_kind" NOT NULL,
	"name" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"credits" integer,
	"duration_months" integer,
	"unit" "product_unit",
	"group_min" integer,
	"group_max" integer,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_not_negative" CHECK ("products"."price" >= 0),
	CONSTRAINT "products_membership_has_credits" CHECK ("products"."kind" <> 'membership' OR "products"."credits" IS NOT NULL),
	CONSTRAINT "products_group_in_order" CHECK ("products"."group_min" IS NULL OR "products"."group_max" IS NULL OR "products"."group_min" <= "products"."group_max")
);--> statement-breakpoint
INSERT INTO "products" ("id", "kind", "name", "price", "credits", "duration_months", "is_archived")
SELECT "id", 'membership', "name", "base_price", "default_credits", "duration_months", "is_archived"
FROM "memberships";--> statement-breakpoint
-- "Famille (3-5 pax)" becomes "Famille", for 3 to 5 people; "Groupe (10+
-- pax)", 10 people or more; "Duo (2 pax)", exactly 2. A name without a
-- group size stays as it is, for any group.
INSERT INTO "products" ("id", "kind", "name", "price", "unit", "group_min", "group_max", "is_archived", "created_at")
SELECT
	r."id",
	'partner_service',
	COALESCE(p.g[1], r."name"),
	r."price",
	'session',
	LEAST(p.g[2]::int, COALESCE(p.g[4], p.g[2])::int),
	CASE WHEN p.g[3] IS NOT NULL THEN NULL ELSE GREATEST(p.g[2]::int, COALESCE(p.g[4], p.g[2])::int) END,
	r."is_archived",
	r."created_at"
FROM "partner_rates" r,
	LATERAL (
		SELECT regexp_match(r."name", '^(.*\S)\s*\(\s*(\d+)\s*(?:(\+)|(?:-|–|à)\s*(\d+))?\s*(?:pax|pers\.?|personnes?)\s*\)\s*$', 'i') AS g
	) p;--> statement-breakpoint
ALTER TABLE "client_wallets" DROP CONSTRAINT "client_wallets_membership_id_memberships_id_fk";--> statement-breakpoint
ALTER TABLE "client_wallets" RENAME COLUMN "membership_id" TO "product_id";--> statement-breakpoint
ALTER TABLE "client_wallets" ADD CONSTRAINT "client_wallets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- A line sold from her price list remembers the service and what its
-- quantity counts. Lines written before keep none: an issued document
-- prints as it was issued.
ALTER TABLE "b2b_document_lines" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD COLUMN "unit" "product_unit";--> statement-breakpoint
ALTER TABLE "b2b_document_lines" ADD CONSTRAINT "b2b_document_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TABLE "memberships";--> statement-breakpoint
DROP TABLE "partner_rates";
