-- Create doctors table for Supabase
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

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active doctors" ON doctors
  FOR SELECT USING (isActive = true);

CREATE POLICY "Admins can manage all doctors" ON doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(isActive);
CREATE INDEX IF NOT EXISTS idx_doctors_created_at ON doctors(created_at);

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_doctors_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_doctors_timestamp();