-- Opportunities table for unified opportunity detection
create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  problem text,
  signals_count int not null default 0,
  sources text[] default '{}',
  competitor_gap text,
  opportunity_score float not null default 0,
  confidence float not null default 0,
  demand_mentions int default 0,
  market_trend float default 0,
  created_at timestamptz default now()
);

alter table public.opportunities enable row level security;
create policy "Allow all opportunities" on public.opportunities for all using (true);

create index if not exists opportunities_score_idx on public.opportunities(opportunity_score desc);
