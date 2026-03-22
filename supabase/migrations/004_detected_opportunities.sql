-- ============================================================
-- Detected Opportunities: unified internal + external + competitor
-- Run after 001, 002, 003
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

create policy "Allow all detected_opportunities"
  on public.detected_opportunities for all using (true);

create index if not exists detected_opportunities_workspace_idx
  on public.detected_opportunities(workspace_id);
create index if not exists detected_opportunities_priority_idx
  on public.detected_opportunities(priority);
create index if not exists detected_opportunities_created_idx
  on public.detected_opportunities(created_at desc);
