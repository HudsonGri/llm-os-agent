CREATE TABLE IF NOT EXISTS chats (
  id text PRIMARY KEY,
  user_id text,
  user_ip varchar(45),
  user_agent text,
  role text NOT NULL,
  content text NOT NULL,
  tool_invocations jsonb,
  parent_message_id text REFERENCES chats(id),
  conversation_id text NOT NULL,
  token_count integer,
  processing_time_ms integer,
  rating text,
  rated_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Create index for conversation_id to speed up conversation lookups
CREATE INDEX idx_chats_conversation_id ON chats(conversation_id);

-- Create index for user_id for future auth integration
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- Create index for created_at to speed up time-based queries
CREATE INDEX idx_chats_created_at ON chats(created_at);

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 