CREATE TYPE plan_type AS ENUM ('solo', 'team');
  CREATE TYPE plan_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'paused');

  CREATE TABLE subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id VARCHAR(255) UNIQUE,
      plan plan_type NOT NULL DEFAULT 'solo',
      status plan_status NOT NULL DEFAULT 'trialing',
      trial_ends_at TIMESTAMPTZ,
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      canceled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
  CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);