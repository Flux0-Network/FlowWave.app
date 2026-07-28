-- FlowWave – extend schema (run AFTER 001_bots.sql)
-- Adds files, folders, deploys, env vars, and database connections

CREATE TABLE IF NOT EXISTS public.project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bot_id, name)
);

CREATE TABLE IF NOT EXISTS public.project_folders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  UNIQUE(bot_id, path)
);

CREATE TABLE IF NOT EXISTS public.project_deploys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  ts          BIGINT NOT NULL,
  ok          BOOLEAN NOT NULL,
  msg         TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_env_vars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  hidden      BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(bot_id, key)
);

CREATE TABLE IF NOT EXISTS public.project_connections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id      UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE UNIQUE,
  url         TEXT NOT NULL,
  anon_key    TEXT NOT NULL,
  service_key TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_project_files_bot_id    ON public.project_files(bot_id);
CREATE INDEX IF NOT EXISTS idx_project_deploys_bot_id  ON public.project_deploys(bot_id);
CREATE INDEX IF NOT EXISTS idx_project_env_vars_bot_id ON public.project_env_vars(bot_id);
