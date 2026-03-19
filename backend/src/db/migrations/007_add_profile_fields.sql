-- Migration: 007_add_profile_fields
-- Adds missing fields to profiles and teams per design spec

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability VARCHAR(50) DEFAULT 'FULL_TIME',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100),
  ADD COLUMN IF NOT EXISTS portfolio_url VARCHAR(255),
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE;

ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'Online',
  ADD COLUMN IF NOT EXISTS max_team_size INT DEFAULT 4,
  ADD COLUMN IF NOT EXISTS registration_url VARCHAR(255);
