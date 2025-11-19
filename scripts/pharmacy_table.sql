-- Pharmacy Table Migration Script
-- Run this script in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pharmacy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  pharmacy_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_pharmacy_email ON pharmacy(email);

-- Add comment to table
COMMENT ON TABLE pharmacy IS 'Stores pharmacy user information and credentials';

