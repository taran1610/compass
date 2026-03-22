-- Features table for RICE prioritization
create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  feature text not null,
  reach int not null default 50,
  impact int not null default 2 check (impact between 1 and 3),
  confidence int not null default 80 check (confidence between 0 and 100),
  effort int not null default 3 check (effort between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feature signals: document mention counts per source type
create table if not exists public.feature_signals (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.features(id) on delete cascade,
  source_type text not null check (source_type in ('interviews', 'feature-requests', 'support-tickets', 'analytics')),
  mention_count int not null default 0,
  document_ids bigint[] default '{}',
  created_at timestamptz default now(),
  unique(feature_id, source_type)
);

-- AI-suggested features (extracted from documents, not yet added)
create table if not exists public.suggested_features (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  feature text not null,
  reach int not null default 50,
  impact int not null default 2,
  confidence int not null default 80,
  effort int not null default 3,
  reason text,
  source_document_ids bigint[] default '{}',
  created_at timestamptz default now()
);

-- Extend documents metadata for source type
-- metadata can include: { "source_type": "interviews" | "feature-requests" | "support-tickets" | "analytics", "file_name": "..." }

-- RLS
alter table public.features enable row level security;
alter table public.feature_signals enable row level security;
alter table public.suggested_features enable row level security;

create policy "Users can manage features via workspace"
  on public.features for all
  using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

create policy "Users can manage feature_signals via feature"
  on public.feature_signals for all
  using (
    feature_id in (
      select f.id from public.features f
      join public.workspaces w on f.workspace_id = w.id
      where w.user_id = auth.uid()
    )
  );

create policy "Users can manage suggested_features via workspace"
  on public.suggested_features for all
  using (
    workspace_id in (select id from public.workspaces where user_id = auth.uid())
  );

-- Indexes
create index if not exists features_workspace_idx on public.features(workspace_id);
create index if not exists feature_signals_feature_idx on public.feature_signals(feature_id);
create index if not exists suggested_features_workspace_idx on public.suggested_features(workspace_id);
