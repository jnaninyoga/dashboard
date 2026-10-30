CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'cancelled');--> statement-breakpoint
CREATE TABLE "studio_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_event_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "slot_type" NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "studio_sessions_google_event_id_unique" UNIQUE("google_event_id")
);
--> statement-breakpoint
ALTER TABLE "attendance_ledger" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
CREATE INDEX "studio_sessions_starts_at_idx" ON "studio_sessions" USING btree ("starts_at");