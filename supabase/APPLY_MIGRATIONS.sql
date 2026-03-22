-- ============================================================
-- Compass: Run this in Supabase SQL Editor to create all tables
-- Dashboard → SQL Editor → New query → Paste → Run
-- ============================================================

-- 1. Enable pgvector
create extension if not exists vector with schema extensions;

-- 2. Documents table for RAG (chunks with embeddings)
create table if not exists public.documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}',
  embedding extensions.vector(1536),
  created_at timestamptz default now()
);

-- 3. match_documents function for vector search
create or replace function match_documents (
  query_embedding extensions.vector(1536),
  match_count int default 5,
  filter jsonb default '{}'
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql
as $$
  select
    d.id,
    d.content,
    d.metadata,
    (1 - (d.embedding <=> query_embedding))::float as similarity
  from public.documents d
  where d.embedding is not null
    and (filter = '{}' or d.metadata @> filter)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- 4. Documents RLS
alter table public.documents enable row level security;
drop policy if exists "Allow read documents" on public.documents;
create policy "Allow read documents" on public.documents for select using (true);
drop policy if exists "Allow insert documents" on public.documents;
create policy "Allow insert documents" on public.documents for insert with check (true);
drop policy if exists "Allow delete documents" on public.documents;
create policy "Allow delete documents" on public.documents for delete using (true);

-- 5. Vector index (may warn if table is empty - that's ok)
create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 6. Workspaces table
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;
drop policy if exists "Users can manage own workspaces" on public.workspaces;
create policy "Users can manage own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id);

-- 7. Features table (RICE prioritization)
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

create table if not exists public.feature_signals (
  id uuid primary key default gen_random_uuid(),
  feature_id uuid references public.features(id) on delete cascade,
  source_type text not null check (source_type in ('interviews', 'feature-requests', 'support-tickets', 'analytics')),
  mention_count int not null default 0,
  document_ids bigint[] default '{}',
  created_at timestamptz default now(),
  unique(feature_id, source_type)
);

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

alter table public.features enable row level security;
alter table public.feature_signals enable row level security;
alter table public.suggested_features enable row level security;

drop policy if exists "Users can manage features via workspace" on public.features;
create policy "Users can manage features via workspace"
  on public.features for all
  using (workspace_id in (select w.id from public.workspaces w where w.user_id = auth.uid()));

drop policy if exists "Users can manage feature_signals via feature" on public.feature_signals;
create policy "Users can manage feature_signals via feature"
  on public.feature_signals for all
  using (feature_id in (
    select f.id from public.features f
    join public.workspaces w on f.workspace_id = w.id
    where w.user_id = auth.uid()
  ));

drop policy if exists "Users can manage suggested_features via workspace" on public.suggested_features;
create policy "Users can manage suggested_features via workspace"
  on public.suggested_features for all
  using (workspace_id in (select w.id from public.workspaces w where w.user_id = auth.uid()));

create index if not exists features_workspace_idx on public.features(workspace_id);
create index if not exists feature_signals_feature_idx on public.feature_signals(feature_id);
create index if not exists suggested_features_workspace_idx on public.suggested_features(workspace_id);

-- ============================================================
-- 8. Market Intelligence Engine
-- ============================================================
create table if not exists public.market_signals (
  id bigserial primary key,
  source text not null check (source in ('reddit', 'x', 'product_reviews', 'startup_forum', 'community')),
  content text not null,
  topic text,
  author text,
  url text,
  metadata jsonb default '{}',
  embedding extensions.vector(1536),
  created_at timestamptz default now()
);
create index if not exists market_signals_source_idx on public.market_signals(source);
create index if not exists market_signals_created_idx on public.market_signals(created_at desc);
create index if not exists market_signals_embedding_idx on public.market_signals using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function match_market_signals (query_embedding extensions.vector(1536), match_count int default 20, filter_source text default null)
returns table (id bigint, content text, source text, topic text, created_at timestamptz, similarity float)
language sql as $$
  select s.id, s.content, s.source, s.topic, s.created_at, (1 - (s.embedding <=> query_embedding))::float as similarity
  from public.market_signals s where s.embedding is not null and (filter_source is null or s.source = filter_source)
  order by s.embedding <=> query_embedding limit match_count;
$$;

create table if not exists public.market_trends (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  mention_count int not null default 0,
  growth_indicator text check (growth_indicator in ('rising', 'stable', 'declining')),
  sample_quotes text[] default '{}',
  signal_ids bigint[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.market_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  mention_count int not null default 0,
  opportunity_score int check (opportunity_score between 0 and 100),
  sources text[] default '{}',
  signal_ids bigint[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.competitor_insights (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid references public.competitors(id) on delete cascade,
  insight_type text not null check (insight_type in ('complaint', 'feature_gap', 'missing_capability')),
  content text not null,
  mention_count int not null default 0,
  signal_ids bigint[] default '{}',
  created_at timestamptz default now()
);

create table if not exists public.market_ai_insights (
  id uuid primary key default gen_random_uuid(),
  insight text not null,
  category text,
  created_at timestamptz default now()
);

alter table public.market_signals enable row level security;
alter table public.market_trends enable row level security;
alter table public.market_opportunities enable row level security;
alter table public.competitors enable row level security;
alter table public.competitor_insights enable row level security;
alter table public.market_ai_insights enable row level security;

drop policy if exists "Allow read market_signals" on public.market_signals;
create policy "Allow read market_signals" on public.market_signals for select using (true);
create policy "Allow insert market_signals" on public.market_signals for insert with check (true);

drop policy if exists "Allow all market_trends" on public.market_trends;
create policy "Allow all market_trends" on public.market_trends for all using (true);

drop policy if exists "Allow all market_opportunities" on public.market_opportunities;
create policy "Allow all market_opportunities" on public.market_opportunities for all using (true);

drop policy if exists "Allow all competitors" on public.competitors;
create policy "Allow all competitors" on public.competitors for all using (true);

drop policy if exists "Allow all competitor_insights" on public.competitor_insights;
create policy "Allow all competitor_insights" on public.competitor_insights for all using (true);

drop policy if exists "Allow all market_ai_insights" on public.market_ai_insights;
create policy "Allow all market_ai_insights" on public.market_ai_insights for all using (true);

-- ============================================================
-- 9. Detected Opportunities (unified internal + external + competitor)
-- ============================================================
create table if not exists public.detected_opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete cascade,
  title text not null,
  feature_requests int not null default 0,
  support_tickets int not null default 0,
  interview_mentions int not null default 0,
  reddit_mentions int not null default 0,
  x_mentions int not null default 0,
  product_review_mentions int not null default 0,
  competitor_missing boolean not null default false,
  competitor_names text[] default '{}',
  priority text not null check (priority in ('high', 'medium', 'low')),
  confidence int not null check (confidence between 0 and 100),
  created_at timestamptz default now()
);
alter table public.detected_opportunities enable row level security;
create policy "Allow all detected_opportunities" on public.detected_opportunities for all using (true);
create index if not exists detected_opportunities_workspace_idx on public.detected_opportunities(workspace_id);
create index if not exists detected_opportunities_priority_idx on public.detected_opportunities(priority);
create index if not exists detected_opportunities_created_idx on public.detected_opportunities(created_at desc);

-- ============================================================
-- 10. Waitlist signups (marketing landing page)
-- ============================================================
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);
create index if not exists waitlist_signups_email_idx on public.waitlist_signups (email);
alter table public.waitlist_signups enable row level security;
drop policy if exists "Allow anonymous insert for waitlist" on public.waitlist_signups;
create policy "Allow anonymous insert for waitlist" on public.waitlist_signups for insert with check (true);

-- ============================================================
-- 11. Subscriptions (Stripe)
-- ============================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_idx on public.subscriptions(stripe_subscription_id);
alter table public.subscriptions enable row level security;
create policy "Users can read own subscription" on public.subscriptions for select using (auth.uid() = user_id);

-- ============================================================
-- 12. User feedback (in-app feedback)
-- ============================================================
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  image_urls text[] default '{}',
  user_id uuid,
  created_at timestamptz default now()
);
create index if not exists user_feedback_user_id_idx on public.user_feedback (user_id);
create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);
alter table public.user_feedback enable row level security;
create policy "Allow insert for feedback" on public.user_feedback for insert with check (true);

-- ============================================================
-- 13. Analysis cache (persist insights/features to avoid re-running AI)
-- ============================================================
create table if not exists public.analysis_cache (
  id text primary key default 'default',
  document_count int not null,
  insights_json jsonb not null default '{}',
  features_json jsonb not null default '[]',
  created_at timestamptz default now()
);
alter table public.analysis_cache enable row level security;
create policy "Allow all analysis_cache" on public.analysis_cache for all using (true);
