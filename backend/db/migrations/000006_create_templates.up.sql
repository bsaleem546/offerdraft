CREATE TABLE templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      loan_type VARCHAR(50),
      closing_days INTEGER,
      contingencies JSONB DEFAULT '[]',
      cover_letter_tone VARCHAR(50) DEFAULT 'professional',
      default_terms TEXT,
      last_used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_templates_user ON templates(user_id);