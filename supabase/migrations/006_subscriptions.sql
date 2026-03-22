-- Subscriptions table for Stripe integration
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan text not null default 'free', -- free | starter | pro | enterprise
  status text not null default 'active', -- active | canceled | past_due | trialing
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_stripe_subscription_idx on public.subscriptions(stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Inserts/updates done via API with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS)
