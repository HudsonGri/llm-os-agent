CREATE TABLE IF NOT EXISTS "sample_questions_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"category" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
