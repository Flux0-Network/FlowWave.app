-- Disable RLS on all FlowWave tables.
-- Security is enforced server-side via next-auth session checks in API routes.

ALTER TABLE public.projects          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files     DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_folders   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deploys   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_env_vars  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_connections DISABLE ROW LEVEL SECURITY;
