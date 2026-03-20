-- Add new columns to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS work_type TEXT DEFAULT 'full-time';
ALTER TABLE workers ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE workers ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
