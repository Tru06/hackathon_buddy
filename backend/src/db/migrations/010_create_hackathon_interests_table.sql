-- Migration: 010_create_hackathon_interests_table
-- Tracks which users have expressed interest in a hackathon

CREATE TABLE IF NOT EXISTS hackathon_interests (
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (hackathon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_hackathon_interests_user ON hackathon_interests(user_id);
