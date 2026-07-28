-- Built-in database feature: per-project tables and rows stored in FlowWave's Supabase

CREATE TABLE IF NOT EXISTS public.project_user_tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  columns     JSONB NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, name)
);

CREATE TABLE IF NOT EXISTS public.project_user_rows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  table_name  TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.project_user_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_user_rows   DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_rows_project_table
  ON public.project_user_rows(project_id, table_name);
