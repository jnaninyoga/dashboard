CREATE TYPE "public"."booking_request_kind" AS ENUM('card', 'class', 'other');--> statement-breakpoint
CREATE TYPE "public"."booking_request_status" AS ENUM('new', 'confirmed', 'declined');--> statement-breakpoint
CREATE TYPE "public"."site_lang" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TABLE "booking_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text,
	"kind" "booking_request_kind" NOT NULL,
	"choice_key" text,
	"choice_label" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"message" text,
	"lang" "site_lang" DEFAULT 'fr' NOT NULL,
	"status" "booking_request_status" DEFAULT 'new' NOT NULL,
	"status_changed_at" timestamp,
	"client_id" uuid,
	"ip_hash" text,
	"erased_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "booking_requests_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_ok_at" timestamp,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "booking_requests" ADD CONSTRAINT "booking_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_requests_status_created_idx" ON "booking_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "booking_requests_ip_created_idx" ON "booking_requests" USING btree ("ip_hash","created_at");