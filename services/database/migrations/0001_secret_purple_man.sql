ALTER TYPE "public"."slot_type" ADD VALUE 'b2b';--> statement-breakpoint
CREATE TABLE "b2b_pricing_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
