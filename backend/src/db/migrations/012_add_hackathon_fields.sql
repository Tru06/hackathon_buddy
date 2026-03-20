-- Migration: 012_add_hackathon_fields
-- Adds missing columns to hackathons table

ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS max_team_size INT NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS registration_url TEXT;

-- Unique constraint on title so ON CONFLICT works in seed
CREATE UNIQUE INDEX IF NOT EXISTS hackathons_title_unique ON hackathons (title);
