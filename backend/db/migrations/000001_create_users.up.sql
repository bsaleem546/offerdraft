CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      agency_name VARCHAR(255),
      logo_url TEXT,
      brand_color VARCHAR(7) DEFAULT '#AAFF45',
      pdf_footer_text VARCHAR(255),
      license_number VARCHAR(100),
      state VARCHAR(50),
      default_contingencies JSONB DEFAULT '[]',
      default_closing_days INTEGER DEFAULT 30,
      cover_letter_tone VARCHAR(50) DEFAULT 'professional',
      default_earnest_money_pct NUMERIC(5,2) DEFAULT 1.00,
      stripe_customer_id VARCHAR(255),
      email_verified BOOLEAN DEFAULT FALSE,
      email_verify_token VARCHAR(255),
      password_reset_token VARCHAR(255),
      password_reset_expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);