CREATE TYPE doc_type AS ENUM ('pre_approval', 'proof_of_funds', 'additional');

  CREATE TABLE uploaded_documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id UUID NOT NULL REFERENCES offer_packages(id) ON DELETE CASCADE,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_key TEXT NOT NULL,
      file_size_bytes BIGINT,
      doc_type doc_type NOT NULL DEFAULT 'additional',
      sort_order INTEGER DEFAULT 0,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_docs_package ON uploaded_documents(package_id);
