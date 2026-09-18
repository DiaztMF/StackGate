CREATE TYPE "public"."priority" AS ENUM('urgent', 'high', 'medium', 'low', 'none');--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "priority" "priority" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "target_date" timestamp;