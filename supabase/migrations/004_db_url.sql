-- Add direct PostgreSQL connection URL to project_connections
ALTER TABLE public.project_connections ADD COLUMN IF NOT EXISTS db_url TEXT NOT NULL DEFAULT '';
