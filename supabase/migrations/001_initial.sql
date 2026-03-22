-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Documents table for RAG (chunks with embeddings) - LangChain compatible
create table if not exists public.documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb default '{}',
  embedding extensions.vector(1536),
  created_at timestamptz default now()
);

-- match_documents function for LangChain SupabaseVectorStore
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
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where documents.embedding is not null
    and (filter = '{}' or documents.metadata @> filter)
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- RLS
alter table public.documents enable row level security;

create policy "Allow read documents" on public.documents for select using (true);
create policy "Allow insert documents" on public.documents for insert with check (true);
create policy "Allow delete documents" on public.documents for delete using (true);

-- Index for similarity search
create index if not exists documents_embedding_idx
  on public.documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Workspaces table (minimal for MVP)
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;

create policy "Users can manage own workspaces"
  on public.workspaces for all
  using (auth.uid() = user_id);
