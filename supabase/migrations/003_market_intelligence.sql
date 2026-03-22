-- ============================================================
-- Market Intelligence Engine
-- Run in Supabase SQL Editor after 001_initial.sql and 002_features.sql
-- ============================================================

-- 1. market_signals: raw signals from external sources
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
create index if not exists market_signals_topic_idx on public.market_signals(topic) where topic is not null;

create index if not exists market_signals_embedding_idx
  on public.market_signals
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 2. match_market_signals for vector search
create or replace function match_market_signals (
  query_embedding extensions.vector(1536),
  match_count int default 20,
  filter_source text default null
)
returns table (
  id bigint,
  content text,
  source text,
  topic text,
  created_at timestamptz,
  similarity float
)
language sql
as $$
  select
    s.id,
    s.content,
    s.source,
    s.topic,
    s.created_at,
    (1 - (s.embedding <=> query_embedding))::float as similarity
  from public.market_signals s
  where s.embedding is not null
    and (filter_source is null or s.source = filter_source)
  order by s.embedding <=> query_embedding
  limit match_count;
$$;

-- 3. market_trends: clustered trending topics
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

-- 4. market_opportunities: detected product opportunities
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

-- 5. competitors: user-defined competitor tracking
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- 6. competitor_insights: analyzed gaps and complaints per competitor
create table if not exists public.competitor_insights (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid references public.competitors(id) on delete cascade,
  insight_type text not null check (insight_type in ('complaint', 'feature_gap', 'missing_capability')),
  content text not null,
  mention_count int not null default 0,
  signal_ids bigint[] default '{}',
  created_at timestamptz default now()
);

-- 7. market_ai_insights: generated natural language insights
create table if not exists public.market_ai_insights (
  id uuid primary key default gen_random_uuid(),
  insight text not null,
  category text,
  created_at timestamptz default now()
);

-- RLS: market data is readable by all authenticated users
alter table public.market_signals enable row level security;
alter table public.market_trends enable row level security;
alter table public.market_opportunities enable row level security;
alter table public.competitors enable row level security;
alter table public.competitor_insights enable row level security;
alter table public.market_ai_insights enable row level security;

create policy "Allow read market_signals" on public.market_signals for select using (true);
create policy "Allow insert market_signals" on public.market_signals for insert with check (true);

create policy "Allow read market_trends" on public.market_trends for select using (true);
create policy "Allow all market_trends" on public.market_trends for all using (true);

create policy "Allow read market_opportunities" on public.market_opportunities for select using (true);
create policy "Allow all market_opportunities" on public.market_opportunities for all using (true);

create policy "Allow read competitors" on public.competitors for select using (true);
create policy "Allow all competitors" on public.competitors for all using (true);

create policy "Allow read competitor_insights" on public.competitor_insights for select using (true);
create policy "Allow all competitor_insights" on public.competitor_insights for all using (true);

create policy "Allow read market_ai_insights" on public.market_ai_insights for select using (true);
create policy "Allow all market_ai_insights" on public.market_ai_insights for all using (true);
