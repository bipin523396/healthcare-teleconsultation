-- Create doctors table for Supabase (No Auth Required)
CREATE TABLE IF NOT EXISTS doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  imageUrl TEXT,
  availableDates TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  experience INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  email TEXT,
  phone TEXT,
  consultationTypes TEXT[] DEFAULT '{}',
  fees INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS but allow all operations
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Allow all operations without authentication
CREATE POLICY "Allow all operations on doctors" ON doctors
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(isActive);