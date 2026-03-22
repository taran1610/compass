-- ============================================================
-- Analysis cache: persist insights and features to avoid re-running AI
-- Invalidated when document count changes (new uploads)
-- Single row: we upsert; cache hit when document_count matches current
-- ============================================================

create table if not exists public.analysis_cache (
  id text primary key default 'default',
  document_count int not null,
  insights_json jsonb not null default '{}',
  features_json jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table public.analysis_cache enable row level security;

create policy "Allow all analysis_cache"
  on public.analysis_cache for all using (true);
