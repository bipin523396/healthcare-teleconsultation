-- Drop existing table completely
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table with exact column names
CREATE TABLE doctors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  "imageUrl" TEXT,
  "availableDates" TEXT[] DEFAULT '{}',
  qualifications TEXT[] DEFAULT '{}',
  experience INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{}',
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 5.0,
  email TEXT,
  phone TEXT,
  "consultationTypes" TEXT[] DEFAULT '{}',
  fees INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS completely for testing
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;