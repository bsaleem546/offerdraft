 CREATE TYPE package_status AS ENUM ('draft', 'complete', 'archived');

  CREATE TABLE offer_packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status package_status NOT NULL DEFAULT 'draft',

      -- Property
      property_address TEXT NOT NULL,
      listing_price NUMERIC(12,2),
      property_type VARCHAR(50),
      mls_number VARCHAR(100),
      bedrooms NUMERIC(4,1),
      bathrooms NUMERIC(4,1),
      year_built INTEGER,
      notable_features TEXT,

      -- Offer
      offer_amount NUMERIC(12,2) NOT NULL,
      earnest_money NUMERIC(12,2),
      down_payment_pct NUMERIC(5,2),
      loan_type VARCHAR(50),
      closing_date DATE,
      contingencies JSONB DEFAULT '[]',
      escalation_active BOOLEAN DEFAULT FALSE,
      escalation_max_price NUMERIC(12,2),
      escalation_increment NUMERIC(12,2),
      additional_terms TEXT,

      -- Buyer
      buyer_name VARCHAR(255),
      buyer_story TEXT,

      -- AI Output
      cover_letter_text TEXT,
      offer_summary_text TEXT,

      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_packages_user ON offer_packages(user_id);
  CREATE INDEX idx_packages_status ON offer_packages(status);