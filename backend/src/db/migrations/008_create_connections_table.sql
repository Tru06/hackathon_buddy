-- Migration: 008_create_connections_table
-- Creates connection_requests table for teammate discovery

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_connection CHECK (from_user_id != to_user_id),
  CONSTRAINT unique_pending_connection UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_connections_to_user ON connection_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_connections_from_user ON connection_requests(from_user_id);
