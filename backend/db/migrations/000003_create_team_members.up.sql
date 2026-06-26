CREATE TABLE team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      invited_email VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'member',
      invite_token VARCHAR(255),
      invite_accepted BOOLEAN DEFAULT FALSE,
      invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      joined_at TIMESTAMPTZ
  );

  CREATE INDEX idx_team_owner ON team_members(owner_user_id);
  CREATE INDEX idx_team_member ON team_members(member_user_id);