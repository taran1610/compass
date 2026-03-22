-- Waitlist signups table for marketing landing page
create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz default now()
);

-- Index for lookups by email
create index if not exists waitlist_signups_email_idx on public.waitlist_signups (email);

-- RLS: allow anonymous insert (signup)
alter table public.waitlist_signups enable row level security;

create policy "Allow anonymous insert for waitlist" on public.waitlist_signups
  for insert with check (true);
