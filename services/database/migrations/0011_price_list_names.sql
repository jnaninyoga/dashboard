-- Her price list in her words: "Categories" are discounts, "B2B pricing" is
-- partner rates, membership products are memberships. Renames only: no data
-- is copied or dropped, and the old rows, ids and links stay as they are.
ALTER TABLE "membership_products" RENAME TO "memberships";--> statement-breakpoint
ALTER TABLE "client_categories" RENAME TO "discounts";--> statement-breakpoint
ALTER TABLE "b2b_pricing_tiers" RENAME TO "partner_rates";--> statement-breakpoint
ALTER TABLE "clients" RENAME COLUMN "category_id" TO "discount_id";--> statement-breakpoint
ALTER TABLE "client_wallets" RENAME COLUMN "product_id" TO "membership_id";--> statement-breakpoint
-- Constraint names follow, so later migrations find them by their new names.
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'membership_products_pkey') THEN
		ALTER TABLE "memberships" RENAME CONSTRAINT "membership_products_pkey" TO "memberships_pkey";
	END IF;
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_categories_pkey') THEN
		ALTER TABLE "discounts" RENAME CONSTRAINT "client_categories_pkey" TO "discounts_pkey";
	END IF;
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'b2b_pricing_tiers_pkey') THEN
		ALTER TABLE "partner_rates" RENAME CONSTRAINT "b2b_pricing_tiers_pkey" TO "partner_rates_pkey";
	END IF;
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clients_category_id_client_categories_id_fk') THEN
		ALTER TABLE "clients" RENAME CONSTRAINT "clients_category_id_client_categories_id_fk" TO "clients_discount_id_discounts_id_fk";
	END IF;
	IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_wallets_product_id_membership_products_id_fk') THEN
		ALTER TABLE "client_wallets" RENAME CONSTRAINT "client_wallets_product_id_membership_products_id_fk" TO "client_wallets_membership_id_memberships_id_fk";
	END IF;
END $$;
