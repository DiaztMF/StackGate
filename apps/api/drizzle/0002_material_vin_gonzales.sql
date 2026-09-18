ALTER TYPE "public"."role" ADD VALUE 'superadmin';--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;