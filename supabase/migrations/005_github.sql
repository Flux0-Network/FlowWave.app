-- GitHub OAuth tokens per user
CREATE TABLE IF NOT EXISTS public.user_github_tokens (
  user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.user_github_tokens DISABLE ROW LEVEL SECURITY;

-- GitHub repo linkage on projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS github_owner TEXT,
  ADD COLUMN IF NOT EXISTS github_repo  TEXT,
  ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main';
