CREATE TABLE IF NOT EXISTS "sample_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"category" text,
	"position" integer NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" DROP CONSTRAINT "chats_parent_message_id_chats_id_fk";
