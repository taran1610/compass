-- User feedback table for in-app feedback
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  image_urls text[] default '{}',
  user_id uuid,
  created_at timestamptz default now()
);

-- Index for lookups by user and date
create index if not exists user_feedback_user_id_idx on public.user_feedback (user_id);
create index if not exists user_feedback_created_at_idx on public.user_feedback (created_at desc);

-- RLS: allow insert from anyone (authenticated or anonymous)
alter table public.user_feedback enable row level security;

create policy "Allow insert for feedback" on public.user_feedback
  for insert with check (true);
