-- Migration: 002_create_profiles_table
-- Creates the profiles table for users

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  experience_level VARCHAR(50),
  github_url VARCHAR(255),
  linkedin_url VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
