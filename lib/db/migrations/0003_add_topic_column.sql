-- Add topic column to chats table
ALTER TABLE chats ADD COLUMN IF NOT EXISTS topic text;

-- Create index for topic to speed up topic-based queries
CREATE INDEX IF NOT EXISTS idx_chats_topic ON chats(topic); 