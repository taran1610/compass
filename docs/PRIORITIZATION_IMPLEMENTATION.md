# Feature Prioritization — Implementation Guide

This document describes the AI-powered RICE prioritization system in Compass.

---

## 1. React Components

| Component | Path | Purpose |
|-----------|------|---------|
| `RicePrioritizer` | `components/tools/rice-prioritizer.tsx` | Main orchestrator: layout, state, table, side panel |
| `RiceInsightsPanel` | `components/tools/rice-insights-panel.tsx` | Top 3 insight cards: Top Priority, Most Requested, Highest Impact |
| `RiceImpactEffortChart` | `components/tools/rice-impact-effort-chart.tsx` | 2×2 scatter chart: Impact vs Effort quadrants |
| `RiceFeatureCard` | `components/tools/rice-feature-card.tsx` | Editable feature card with sliders + signal badges |
| `RiceSuggestedFeatures` | `components/tools/rice-suggested-features.tsx` | AI-suggested features (add to list) |

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Title, Add, CSV                                          │
├─────────────────────────────────────────────────────────────────┤
│ Insights Panel (3 cards)                                         │
├───────────────────────────────────────┬─────────────────────────┤
│ Impact vs Effort Chart                │ Side Panel              │
│ (2×2 quadrants, points)               │ - Feature card editor   │
├───────────────────────────────────────│   (sliders + signals)   │
│ Feature Ranking Table                 │ - Or select prompt      │
│ (sortable, top 3 highlight)            │                         │
├───────────────────────────────────────┴─────────────────────────┤
│ AI Suggested Features                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

```sql
-- features: user-scored RICE items
features (
  id uuid PK,
  workspace_id uuid FK → workspaces,
  feature text,
  reach int, impact int, confidence int, effort int,
  created_at, updated_at
)

-- feature_signals: document mention counts per source
feature_signals (
  id uuid PK,
  feature_id uuid FK → features,
  source_type: 'interviews' | 'feature-requests' | 'support-tickets' | 'analytics',
  mention_count int,
  document_ids bigint[]
)

-- suggested_features: AI-extracted, not yet added
suggested_features (
  id uuid PK,
  workspace_id uuid FK → workspaces,
  feature text,
  reach, impact, confidence, effort int,
  reason text,
  source_document_ids bigint[]
)
```

Migration: `supabase/migrations/002_features.sql`

---

## 4. Supabase Queries

```sql
-- List features for workspace
SELECT * FROM features WHERE workspace_id = $1 ORDER BY created_at DESC;

-- Get feature signals
SELECT fs.source_type, fs.mention_count
FROM feature_signals fs
JOIN features f ON fs.feature_id = f.id
WHERE f.id = $1;

-- List suggested features
SELECT * FROM suggested_features WHERE workspace_id = $1 ORDER BY created_at DESC;

-- Documents with metadata (for extraction)
SELECT id, content, metadata FROM documents WHERE embedding IS NOT NULL LIMIT 50;
```

---

## 5. RAG Pipeline for Feature Extraction

### Flow

1. **Fetch documents** — `fetchDocumentsForExtraction()` from `documents` table
2. **LLM extraction** — `extractFeaturesFromContent()` with structured prompt
3. **Aggregate signals** — `aggregateFeatureSignals()` counts mentions per source type

### Files

- `lib/rag/extract-features.ts` — `fetchDocumentsForExtraction`, `extractFeaturesFromContent`, `aggregateFeatureSignals`
- `app/api/features/extract/route.ts` — `POST /api/features/extract`

### Document Metadata

Documents should include `metadata`:

```json
{
  "source_type": "interviews" | "feature-requests" | "support-tickets" | "analytics",
  "file_name": "interview_2024.pdf"
}
```

---

## 6. Prompt Engineering

### Feature Extraction Prompt

```
You are a product intelligence system. Analyze the following documents 
(customer interviews, feature requests, support tickets) and extract 
recurring product/feature requests.

For each distinct feature request:
- name: Short, actionable feature name (e.g. "Bulk CSV export", "Dark mode")
- reach: 0-100, how many users would benefit
- impact: 1-3, user value (3=high)
- confidence: 0-100, how sure you are about the estimates
- effort: 1-100, relative development effort

Deduplicate similar requests. Return 5-15 features. Focus on the most 
frequently mentioned or highest-impact items.
```

### Output Schema (Zod)

```ts
{
  features: [
    { name: string, reach: number, impact: 1|2|3, confidence: number, effort: number }
  ]
}
```

---

## 7. API Integration

### Fetch AI Suggestions

```ts
const res = await fetch("/api/features/extract", { method: "POST" });
const { suggestions } = await res.json();
```

### Wire to Prioritization Page

When `hasUploadedData` is true, call `POST /api/features/extract` and pass `suggestions` to `RiceSuggestedFeatures`. Falls back to mock data when no documents exist.

---

## 8. Impact vs Effort Chart

- **X-axis**: Effort (0–100)
- **Y-axis**: Impact (RICE 1–3 mapped to 0–100)
- **Quadrants**:
  - Top-left: Quick Wins (high impact, low effort)
  - Top-right: Major Projects (high impact, high effort)
  - Bottom-left: Fill-ins (low impact, low effort)
  - Bottom-right: Avoid (low impact, high effort)

Points are interactive; click to select and edit in the side panel.

---

## 9. Future Enhancements

- Persist features to Supabase (per workspace)
- Real-time sync of feature signals when documents are uploaded
- Webhook or background job to run extraction after upload
- Export to roadmap or PRD
