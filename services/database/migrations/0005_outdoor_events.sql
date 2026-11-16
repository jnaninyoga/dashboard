CREATE TYPE "public"."booking_source" AS ENUM('website', 'whatsapp', 'phone', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."booking_request_kind" ADD VALUE 'event';--> statement-breakpoint
CREATE TABLE "event_photos" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title_fr" text NOT NULL,
	"title_en" text,
	"description_fr" text NOT NULL,
	"description_en" text,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"place_name" text NOT NULL,
	"place_maps_url" text,
	"price" numeric(10, 2) NOT NULL,
	"capacity" integer,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"google_event_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_end_after_start" CHECK ("events"."ends_at" > "events"."starts_at"),
	CONSTRAINT "events_price_not_negative" CHECK ("events"."price" >= 0),
	CONSTRAINT "events_capacity_positive" CHECK ("events"."capacity" IS NULL OR "events"."capacity" >= 1)
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "party_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "source" "booking_source" DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "arrived_when_full" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_event_idx" ON "booking_requests" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_party_size_positive" CHECK ("booking_requests"."party_size" >= 1);