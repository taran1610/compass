# Supabase Setup

## 1. Create tables (fix "table not found" error)

If you see "Unable to find your table" in the Supabase dashboard:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New query**
3. Copy the contents of `APPLY_MIGRATIONS.sql`
4. Paste and click **Run**

This creates:
- `documents` — for RAG (embeddings, content, metadata)
- `workspaces` — user workspaces
- `features`, `feature_signals`, `suggested_features` — prioritization

## 2. Environment variables

Ensure `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key  # for embeddings
```

## 3. Upload flow

After tables exist:
1. Click **Upload Documents** in the sidebar
2. Select PDF, TXT, MD, or CSV files
3. Click **Upload & Process**
4. Documents are chunked, embedded, and stored in `documents`
5. RAG (chat, feature extraction, PRD generation) will use them
