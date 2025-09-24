-- EXACT SQL SCRIPT FOR SUPABASE
-- Copy and paste this ENTIRE script into Supabase SQL Editor

-- Drop existing table completely
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table with EXACT field names from AdminDoctorManagementPage
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

-- COMPLETELY DISABLE RLS (Row Level Security) for testing
ALTER TABLE doctors DISABLE ROW LEVEL SECURITY;

-- Insert test data to verify connection
INSERT INTO doctors (name, specialty, email, phone, bio, qualifications, languages, "consultationTypes", fees, "isActive") 
VALUES 
('Dr. Test Doctor', 'Cardiologist', 'test@example.com', '123-456-7890', 'Test doctor bio', 
 ARRAY['MD', 'FACC'], ARRAY['English'], ARRAY['in-person', 'video'], 150, true);

-- Verify table creation
SELECT * FROM doctors;