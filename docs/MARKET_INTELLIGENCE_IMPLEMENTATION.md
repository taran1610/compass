# Market Intelligence Engine - Implementation Plan

## Overview

The Market Intelligence Engine extends Compass to analyze external market signals (Reddit, X, product reviews, startup forums) and identify product opportunities, trends, and competitor gaps.

---

## 1. Database Schema

### Tables (see `supabase/migrations/003_market_intelligence.sql`)

| Table | Purpose |
|-------|---------|
| `market_signals` | Raw text from external sources with embeddings for vector search |
| `market_trends` | Clustered trending topics with mention counts and sample quotes |
| `market_opportunities` | Detected product opportunities with scores |
| `competitors` | User-defined competitor names |
| `competitor_insights` | Complaints, feature gaps, missing capabilities per competitor |
| `market_ai_insights` | Generated natural language insights |

### Vector Search

- `match_market_signals(query_embedding, match_count, filter_source)` - similarity search on embeddings
- Uses pgvector with `ivfflat` index (1536 dimensions, OpenAI text-embedding-3-small)

---

## 2. API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/market` | GET | Fetch trends, opportunities, insights, competitor data for dashboard |
| `/api/market/ingest` | POST | Ingest market signals (body: `{ signals: [{ source, content, topic?, author?, url? }] }`) |
| `/api/market/analyze` | POST | Run trend + opportunity detection (LLM analysis on signals) |
| `/api/market/competitors` | GET | List competitors |
| `/api/market/competitors` | POST | Add competitor (body: `{ name }`) |

---

## 3. Market Signal Ingestion Pipeline

### Background Job (Cron / Vercel Cron / External)

```bash
# Example: ingest from a script
curl -X POST http://localhost:3000/api/market/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {
        "source": "reddit",
        "content": "I really wish AI coding tools could debug my code, not just generate it...",
        "topic": "AI debugging",
        "author": "u/dev123",
        "url": "https://reddit.com/r/programming/..."
      }
    ]
  }'
```

### Data Sources to Integrate

1. **Reddit** - Reddit API or scraping (r/programming, r/SideProject, etc.)
2. **X (Twitter)** - X API v2 for search
3. **Product Reviews** - G2, Capterra, Gartner (scraping or APIs)
4. **Startup Forums** - Indie Hackers, Hacker News
5. **Community** - Discord, Slack communities (manual export or integrations)

### Embedding Pipeline

- Each signal's `content` is embedded via `getEmbeddings()` (OpenAI text-embedding-3-small)
- Stored in `market_signals.embedding` for vector search

---

## 4. Trend Detection Algorithm

1. **Fetch signals** - Last N days from `market_signals`
2. **Embed & cluster** - Use embeddings + clustering (e.g. k-means on normalized vectors) to group similar discussions
3. **LLM summarization** - For each cluster, call `generateObject` to extract:
   - Trend title
   - Mention count estimate
   - Growth indicator (rising/stable/declining)
   - Sample quotes
4. **Upsert** into `market_trends`

---

## 5. Opportunity Detection Algorithm

1. **Cluster complaints** - Group signals that express frustration or unmet needs
2. **Detect feature gaps** - Identify requests for capabilities that don't exist
3. **LLM summarization** - For each cluster:
   - Opportunity title
   - Summary (1-2 sentences)
   - Mention count
   - Opportunity score (0-100)
   - Sources
4. **Insert** into `market_opportunities`

---

## 6. Competitor Intelligence

1. **User adds competitors** - Via UI or API
2. **Search signals** - Vector search for competitor name + "complaint", "missing", "wish", etc.
3. **LLM classification** - Categorize into complaint / feature_gap / missing_capability
4. **Store** in `competitor_insights`

---

## 7. Integration with Internal Features

When `hasUploadedData` is true:

- Compare `market_opportunities` titles with internal `suggested_features` / `features`
- If a trend appears in both internal and market data → **High Confidence Opportunity**
- Highlight in dashboard and suggest adding to RICE prioritization

---

## 8. UI Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `MarketInsightsDashboard` | `components/market/market-insights-dashboard.tsx` | Main page |
| Trending Product Requests | Card with trend list | Top 6 trends with quotes |
| Top Market Opportunities | Card with opportunity cards | Score, summary, Add to Prioritization |
| Competitor Feature Gaps | Card with competitor list | Add competitors, view complaints/gaps |
| AI Market Insights | Card with insight list | Natural language insights |
| Emerging Trends | Full-width grid | All trends with sample quotes |

---

## 9. Applying Migrations

Run in Supabase SQL Editor:

```sql
-- Copy contents of supabase/APPLY_MIGRATIONS.sql or supabase/migrations/003_market_intelligence.sql
```

---

## 10. Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `OPENAI_API_KEY` - For embeddings and LLM (or `ANTHROPIC_API_KEY` for analysis)
