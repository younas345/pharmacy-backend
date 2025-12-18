-- Admin Table
-- This table stores admin users for the PharmAdmin admin panel
-- Admins use a separate authentication system (not Supabase Auth)

CREATE TABLE IF NOT EXISTS public.admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hashed password
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) TABLESPACE pg_default;

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_admin_email ON public.admin(email) TABLESPACE pg_default;

-- Index for active admins
CREATE INDEX IF NOT EXISTS idx_admin_is_active ON public.admin(is_active) TABLESPACE pg_default;

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Comment on table
COMMENT ON TABLE public.admin IS 'Admin users for PharmAdmin admin panel';
COMMENT ON COLUMN public.admin.password_hash IS 'bcrypt hashed password - never store plain text passwords';
