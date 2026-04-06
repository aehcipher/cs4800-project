CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  campus TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('renter', 'lister', 'admin')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('active', 'suspended', 'banned')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  campus TEXT NOT NULL,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  pickup_instructions TEXT NOT NULL,
  dropoff_instructions TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'blocked', 'draft')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id),
  renter_id UUID NOT NULL REFERENCES users(id),
  lister_id UUID NOT NULL REFERENCES users(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  pricing_unit TEXT NOT NULL CHECK (pricing_unit IN ('hourly', 'daily', 'weekly')),
  quantity INTEGER NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  service_fee NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  pickup_window TEXT NOT NULL,
  dropoff_window TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'paid', 'active', 'completed', 'cancelled', 'disputed')),
  conversation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_reference TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('charge', 'refund', 'deposit_release')),
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE escrows (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  deposit_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);
