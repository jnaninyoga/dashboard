CREATE TYPE "public"."booking_source" AS ENUM('website', 'whatsapp', 'phone', 'in_person');--> statement-breakpoint
ALTER TYPE "public"."booking_request_kind" ADD VALUE IF NOT EXISTS 'event';--> statement-breakpoint
CREATE TABLE "session_photos" (
	"session_id" uuid PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "party_size" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "source" "booking_source" DEFAULT 'website' NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD COLUMN "arrived_when_full" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "description_fr" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "place_name" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "place_maps_url" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "capacity" integer;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "on_website" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "session_photos" ADD CONSTRAINT "session_photos_session_id_studio_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_session_id_studio_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."studio_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_session_idx" ON "booking_requests" USING btree ("session_id");--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_party_size_positive" CHECK ("booking_requests"."party_size" >= 1);--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_capacity_positive" CHECK ("studio_sessions"."capacity" IS NULL OR "studio_sessions"."capacity" >= 1);--> statement-breakpoint
ALTER TABLE "studio_sessions" ADD CONSTRAINT "studio_sessions_price_not_negative" CHECK ("studio_sessions"."price" IS NULL OR "studio_sessions"."price" >= 0);