CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  private_name VARCHAR(80) NOT NULL,
  normalized_name VARCHAR(80) NOT NULL UNIQUE,
  recovery_email VARCHAR(255),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  private_place BOOLEAN NOT NULL DEFAULT FALSE,
  draft_name VARCHAR(160),
  publishing VARCHAR(40) NOT NULL DEFAULT 'private',
  nickname VARCHAR(120),
  story_title VARCHAR(220),
  language VARCHAR(80) NOT NULL DEFAULT 'English',
  story_body TEXT,
  approx_date VARCHAR(120),
  region VARCHAR(160),
  warnings TEXT[] NOT NULL DEFAULT '{}',
  understand_privacy BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_ids BOOLEAN NOT NULL DEFAULT FALSE,
  deletion BOOLEAN NOT NULL DEFAULT FALSE,
  rules BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_draft_id UUID REFERENCES story_drafts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(220) NOT NULL,
  excerpt TEXT NOT NULL,
  body TEXT,
  read_time VARCHAR(40),
  language VARCHAR(80) NOT NULL DEFAULT 'English',
  region VARCHAR(160),
  tags TEXT[] NOT NULL DEFAULT '{}',
  warnings TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(40) NOT NULL DEFAULT 'approved',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reaction_label VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE awareness_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  content_type VARCHAR(60) NOT NULL DEFAULT 'Notes',
  thumbnail_key VARCHAR(120),
  thumbnail_url TEXT,
  thumbnail_alt TEXT,
  image_caption VARCHAR(220),
  media_label VARCHAR(120),
  media_url TEXT,
  video_id VARCHAR(40),
  age_group VARCHAR(120) NOT NULL,
  topic VARCHAR(140) NOT NULL,
  summary TEXT NOT NULL,
  points TEXT[] NOT NULL DEFAULT '{}',
  detail_intro TEXT,
  detail_explanation TEXT[] NOT NULL DEFAULT '{}',
  detail_examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  detail_practice TEXT[] NOT NULL DEFAULT '{}',
  detail_check TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  age_group VARCHAR(120),
  topic VARCHAR(140),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mode VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE healing_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  type VARCHAR(80) NOT NULL DEFAULT 'checklist',
  body TEXT NOT NULL,
  steps TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(220) NOT NULL,
  type VARCHAR(140) NOT NULL,
  place VARCHAR(180) NOT NULL,
  hours VARCHAR(120),
  languages VARCHAR(220),
  cost VARCHAR(120),
  contact TEXT NOT NULL,
  verified VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE support_resource_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES support_resources(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  mood VARCHAR(80) NOT NULL DEFAULT 'Steady',
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vault_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(220) NOT NULL,
  incident_date_time VARCHAR(120),
  location TEXT,
  record_type VARCHAR(120) NOT NULL DEFAULT 'Incident note',
  people_involved TEXT,
  witnesses TEXT,
  evidence_file_name TEXT,
  screenshot_reference TEXT,
  medical_legal_follow_up TEXT,
  safety_notes TEXT,
  notes TEXT,
  notes_length INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_drafts_user_id ON story_drafts(user_id);
CREATE INDEX idx_public_stories_status ON public_stories(status);
CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX idx_awareness_lessons_age_topic ON awareness_lessons(age_group, topic);
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_support_resources_place ON support_resources(place);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_vault_cases_user_id ON vault_cases(user_id);
