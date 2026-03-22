# Compass MVP Launch Readiness

## Core Question: "Can a PM upload feedback and get a clear answer about what to build next?"

---

## ✅ What's Ready

### 1. **Sign up**
- Google OAuth via Supabase
- Demo mode (works without Supabase)
- Auth callback, middleware, protected routes

### 2. **Upload**
- Upload dialog (PDF, TXT, MD, CSV)
- `/api/upload` → parse → chunk → embed → store in Supabase `documents`
- Triggers opportunity detection after upload
- `hasUploadedData` from `/api/documents/count`

### 3. **Real AI Output (from uploaded data)**
- **Feature Discovery** (`/api/features/extract`) – extracts features with RICE from documents ✅
- **Opportunity Detection** (`/api/opportunities/detect`) – AI detects opportunities, persists to `detected_opportunities` ✅
- **PRD Generation** (`/api/prd/generate`) – PM + Engineering modes from documents ✅
- **RICE Prioritizer** – uses extracted features ✅
- **Chat** – RAG over uploaded documents ✅

### 4. **"What to build next" path**
- Opportunities feed (detected from uploads)
- Feature discovery engine (suggested features with Add to Prioritization / Generate PRD)
- PRD Builder (Generate from Insights)
- RICE prioritization

---

## ⚠️ Gaps to Fix Before Launch

### 1. **Insights Dashboard** ✅ FIXED
**Location:** `components/dashboard/insights-dashboard.tsx`

Now calls `/api/insights/analyze` and displays real AI-generated pain points, feature demand, retention risks, and AI insights from uploaded documents. Includes loading states and a "Refresh" button to re-analyze.

### 2. **Feature Discovery fallback**
**Location:** `components/discovery/feature-discovery-engine.tsx`

When `/api/features/extract` fails or returns empty, it falls back to `MOCK_DISCOVERED`. Consider showing an empty state or retry instead of mock data.

### 3. **Data sidebar file counts**
**Location:** `app/app/page.tsx` (lines 32–36)

`fileCounts` is hardcoded: `{ interviews: 3, "feature-requests": 2, "support-tickets": 1 }`. Should come from `/api/documents/count` or a similar source.

---

## 📋 Required Setup for Launch

### Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# One of:
ANTHROPIC_API_KEY=   # for Claude (PRD, features, opportunities, insights)
OPENAI_API_KEY=     # for GPT-4o + embeddings (embeddings require OpenAI)
```

### Supabase
- Run migrations: `001_initial.sql` (documents, workspaces), `005_waitlist.sql` (waitlist)
- Google OAuth configured in Supabase Dashboard
- Redirect URLs: `https://your-domain.com/auth/callback`

### Database tables used
- `documents` – RAG chunks (001_initial)
- `detected_opportunities` – opportunity detection (004_detected_opportunities)
- `waitlist_signups` – marketing waitlist (005_waitlist)

---

## Summary

| Criterion              | Status |
|------------------------|--------|
| Real user can sign up  | ✅     |
| Upload real data       | ✅     |
| System produces output | ✅ (with one gap) |
| User sees value fast   | ⚠️ (insights are mock) |
| "What to build next?"  | ✅ (opportunities, features, PRD) |

**Main fix:** Wire the Insights dashboard to `/api/insights/analyze` so pain points, feature demand, retention risks, and AI insights come from uploaded data instead of placeholders.
