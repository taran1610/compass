# Compass — AI Product Intelligence Platform

## Implementation Plan

This document outlines the architecture, components, and pipelines for transforming Compass into a full AI Product Intelligence System.

---

## 1. New React Components

| Component | Path | Purpose |
|-----------|------|---------|
| `FeatureDiscoveryEngine` | `components/discovery/feature-discovery-engine.tsx` | AI feature discovery: scan docs, cluster mentions, suggest features with demand score, Add/PRD buttons |
| `ShareableInsightCard` | `components/insights/shareable-insight-card.tsx` | Viral cards: Export PNG, Copy for X, share link |
| `DecisionLab` | `components/tools/decision-lab.tsx` | Feature simulation: input idea → demand signals, impact, confidence |
| `InsightsDashboard` | `components/dashboard/insights-dashboard.tsx` | Main dashboard: pain points, heatmap, retention risks, AI insights, suggested features |
| `RicePrioritizer` | `components/tools/rice-prioritizer.tsx` | RICE table, Impact vs Effort chart, AI signals, suggestions |
| `UploadDialog` | `components/upload/upload-dialog.tsx` | Smart upload with progress: summarize, extract themes, detect features |

---

## 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Left Sidebar                    │ Top Navigation                        │
│ - Customer Interviews           │ Insights | Chat | Roadmap | PRDs |    │
│ - Feature Requests              │ Research | Prioritization | Decision Lab│
│ - Support Tickets               ├───────────────────────────────────────┤
│ - Product Analytics             │ Main Workspace                        │
│ - Experiments                   │ - Dashboards (Insights)                │
│ - Roadmap                       │ - Artifact editors                     │
│ - Artifacts                     │ - Decision Lab simulator               │
│ [Upload Documents]              │                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Existing

- `documents` — RAG chunks with embeddings, metadata (source_type, file_name)
- `workspaces` — user workspaces

### New (002_features.sql)

- `features` — RICE-scored features per workspace
- `feature_signals` — mention counts per source (interviews, feature-requests, support-tickets)
- `suggested_features` — AI-extracted, not yet added

### Proposed Extensions

```sql
-- product_insights: cached AI-generated insights
create table product_insights (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  insight_type text, -- 'pain_points' | 'retention_risks' | 'ai_summary'
  content jsonb,
  created_at timestamptz default now()
);

-- decision_simulations: store simulation results
create table decision_simulations (
  id uuid primary key,
  workspace_id uuid references workspaces(id),
  feature_name text,
  result jsonb,
  created_at timestamptz default now()
);
```

---

## 4. Supabase Queries

```sql
-- Documents for extraction (with source type)
SELECT id, content, metadata FROM documents WHERE embedding IS NOT NULL LIMIT 50;

-- Features for workspace
SELECT * FROM features WHERE workspace_id = $1 ORDER BY created_at DESC;

-- Feature signals
SELECT fs.source_type, fs.mention_count FROM feature_signals fs
JOIN features f ON fs.feature_id = f.id WHERE f.id = $1;

-- Suggested features
SELECT * FROM suggested_features WHERE workspace_id = $1;
```

---

## 5. Vector Search Improvements

- **Metadata filtering**: Filter by `metadata->>'source_type'` (interviews, feature-requests, support-tickets)
- **Hybrid search**: Combine vector similarity with keyword match for feature names
- **Chunk metadata**: Store `source_type` and `file_name` in document metadata during ingestion

---

## 6. Prompt Pipelines

### Feature Extraction (existing)

- **Input**: Document chunks
- **Output**: Structured features (name, reach, impact, confidence, effort)
- **Prompt**: "Extract recurring product/feature requests. Deduplicate. Return 5-15 features."

### Pain Point Extraction (proposed)

- **Input**: Document chunks
- **Output**: List of pain points
- **Prompt**: "Extract recurring user problems and friction points from the documents."

### Retention Risk Detection (proposed)

- **Input**: Document chunks
- **Output**: Churn/friction signals
- **Prompt**: "Identify retention risks, activation gaps, and churn indicators."

### Decision Simulation (proposed)

- **Input**: Feature name + document context
- **Output**: Demand signals, impact estimates, confidence, effort
- **Prompt**: "Analyze demand for [feature]. Estimate retention impact, enterprise adoption, confidence."

---

## 7. AI Analysis Pipeline

```
Upload → Ingest → Chunk → Embed → Store
                ↓
        [Background / On-demand]
                ↓
    Extract Features ──→ suggested_features
    Extract Pain Points ──→ product_insights
    Detect Retention Risks ──→ product_insights
                ↓
        Populate Dashboard
```

### API Routes

- `POST /api/features/extract` — Feature discovery (existing)
- `POST /api/insights/analyze` — Full analysis (pain points, retention, themes)
- `POST /api/decision/simulate` — Decision Lab simulation

---

## 8. Smart Upload Flow

1. **Upload** — Store files in Supabase Storage
2. **Parse** — Extract text (PDF, MD, TXT, CSV)
3. **Chunk** — Split for RAG
4. **Embed** — Generate embeddings
5. **Store** — Insert into documents with metadata (source_type)
6. **Analyze** — Trigger feature extraction, pain point extraction
7. **Dashboard** — Auto-populate Insights

Progress messages:

- "Storing documents"
- "Summarizing documents"
- "Extracting themes"
- "Detecting feature requests"
- "Detecting pain points"

---

## 9. Shareable Insight Cards

- **Export as PNG**: html2canvas to render card to image
- **Copy for X**: Plain text formatted for Twitter/X
- **Share link**: (Future) Generate shareable URL with embedded insight

---

## 10. UI Design Principles

- **High information density** — No blank space; every view shows data or CTAs
- **Card-based layout** — Insights, features, simulations in cards
- **Interactive charts** — Impact vs Effort, heatmaps, trend indicators
- **Proactive AI** — Surface insights without prompts
- **Linear/Notion/Amplitude** — Clean, minimal, data-forward
