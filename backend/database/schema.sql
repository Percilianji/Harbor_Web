CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  private_name VARCHAR(80) NOT NULL,
  normalized_name VARCHAR(80) NOT NULL UNIQUE,
  recovery_email VARCHAR(255),
  official_email VARCHAR(255),
  role VARCHAR(40) NOT NULL DEFAULT 'community',
  account_status VARCHAR(40) NOT NULL DEFAULT 'active',
  must_reset_password BOOLEAN NOT NULL DEFAULT FALSE,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(60) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE government_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  agency_name VARCHAR(220) NOT NULL,
  position_title VARCHAR(180),
  official_email VARCHAR(255) NOT NULL,
  verification_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose VARCHAR(80) NOT NULL DEFAULT 'official_password_setup',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  published_at DATE DEFAULT CURRENT_DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'published',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
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

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language VARCHAR(40) NOT NULL DEFAULT 'English',
  region VARCHAR(160),
  pledge_type VARCHAR(120) NOT NULL DEFAULT 'community',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(220) NOT NULL,
  image_url TEXT NOT NULL,
  language VARCHAR(40) NOT NULL DEFAULT 'English',
  region VARCHAR(160),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_number VARCHAR(20) NOT NULL,
  source_page VARCHAR(120),
  region VARCHAR(160),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(260) NOT NULL,
  source_name VARCHAR(180),
  source_url TEXT,
  event_region VARCHAR(160),
  category VARCHAR(120),
  published_at TIMESTAMPTZ,
  summary TEXT,
  moderation_status VARCHAR(40) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  consent_to_official_review BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(40) NOT NULL DEFAULT 'private',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_case_id UUID NOT NULL REFERENCES vault_cases(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_story_drafts_user_id ON story_drafts(user_id);
CREATE UNIQUE INDEX idx_users_official_email ON users (LOWER(official_email)) WHERE official_email IS NOT NULL AND official_email <> '';
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_government_profiles_status ON government_profiles(verification_status);
CREATE INDEX idx_invite_tokens_user_id ON invite_tokens(user_id);
CREATE INDEX idx_invite_tokens_expires_at ON invite_tokens(expires_at);
CREATE INDEX idx_public_stories_status ON public_stories(status);
CREATE INDEX idx_story_reactions_story_id ON story_reactions(story_id);
CREATE INDEX idx_awareness_lessons_age_topic ON awareness_lessons(age_group, topic);
CREATE INDEX idx_awareness_lessons_published_at ON awareness_lessons(published_at);
CREATE INDEX idx_awareness_lessons_status ON awareness_lessons(status);
CREATE INDEX idx_awareness_lessons_content_type ON awareness_lessons(content_type);
CREATE INDEX idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX idx_chatbot_messages_conversation_id ON chatbot_messages(conversation_id);
CREATE INDEX idx_support_resources_place ON support_resources(place);
CREATE INDEX idx_campaign_pledges_region ON campaign_pledges(region);
CREATE INDEX idx_campaign_flyers_active ON campaign_flyers(is_active);
CREATE INDEX idx_emergency_interactions_contact ON emergency_interactions(contact_number);
CREATE INDEX idx_news_items_status ON news_items(moderation_status);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_vault_cases_user_id ON vault_cases(user_id);
CREATE INDEX idx_vault_cases_status ON vault_cases(status);
CREATE INDEX idx_vault_cases_official_review ON vault_cases(consent_to_official_review, status);
CREATE INDEX idx_case_assignments_case_id ON case_assignments(vault_case_id);
