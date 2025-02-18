CREATE TABLE IF NOT EXISTS "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"user_ip" varchar(45),
	"user_agent" text,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"tool_invocations" jsonb,
	"parent_message_id" text,
	"conversation_id" text NOT NULL,
	"token_count" integer,
	"processing_time_ms" integer,
	"rating" text,
	"rated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_parent_message_id_chats_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
