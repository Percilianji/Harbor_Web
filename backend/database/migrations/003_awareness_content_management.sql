BEGIN;

ALTER TABLE awareness_lessons
  ADD COLUMN IF NOT EXISTS published_at DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_awareness_lessons_published_at ON awareness_lessons(published_at);
CREATE INDEX IF NOT EXISTS idx_awareness_lessons_status ON awareness_lessons(status);
CREATE INDEX IF NOT EXISTS idx_awareness_lessons_content_type ON awareness_lessons(content_type);

COMMIT;
