# Compass

Compass is an AI product intelligence workspace that helps product teams move from raw feedback to actionable strategy.

Upload interviews, support tickets, feature requests, and research docs. Compass analyzes those signals and helps you:
- detect opportunities
- prioritize work with evidence
- generate PRDs and roadmaps
- chat with your knowledge base

Live app: [compass-iota-tan.vercel.app](https://compass-iota-tan.vercel.app)

## What This Project Includes

- **Marketing site** with product positioning, feature explainers, and waitlist flow
- **Authenticated app workspace** with sidebar, chat, and output tools
- **RAG pipeline** for uploaded docs (ingest, embeddings, retrieval)
- **AI generation tools** for insights, opportunities, PRDs, and prioritization
- **Supabase integration** for auth, storage, and relational data
- **Optional Stripe billing** support (can be ignored if not needed)

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Vercel AI SDK** (streaming responses)
- **Supabase** (Google OAuth, tables, storage)
- **OpenAI / Anthropic** (model provider support)
- **TipTap** (editable rich text outputs)
- **Mermaid** (roadmap/diagram rendering)

## Quick Start

### 1) Install dependencies

```bash
npm install
```

### 2) Create env file

Copy `.env.example` to `.env.local` and fill values:

```bash
cp .env.example .env.local
```

Minimum required for auth + core app:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

Optional:
- `ANTHROPIC_API_KEY` for Anthropic-backed generation
- Stripe variables only if enabling billing

### 3) Configure Supabase Auth (important)

In Supabase Dashboard:

1. Enable **Google** provider in `Authentication -> Providers`
2. Open `Authentication -> URL Configuration`
3. Set:
   - **Site URL**: `http://localhost:3000` (local) or your production domain
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `https://your-production-domain/auth/callback`

If redirect URLs are missing, OAuth can fail after Google sign-in.

### 4) Run database migrations

Apply SQL files in `supabase/migrations/` to your Supabase project in order.

### 5) Start development server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

Use `.env.example` as the source of truth. Current groups:

- **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **AI**
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY` (optional)
- **App URL**
  - `NEXT_PUBLIC_APP_URL` (recommended in production)
- **Stripe** (optional)
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_PRICE_ID_*`
  - `NEXT_PUBLIC_STRIPE_PRICE_ID_*`

## Project Structure

```text
app/
  (marketing)/            # Public landing pages
  (dashboard)/            # Authenticated product workspace
  api/                    # Route handlers (chat, uploads, insights, etc.)
  auth/callback/          # OAuth callback exchange
components/
  dashboard/              # Core dashboard UI
  tools/                  # PRD, prioritization, decision tools
  workspace/              # Workspace tabs/state UI
  providers/              # Auth/theme/workspace providers
lib/
  ai/                     # AI orchestration helpers
  rag/                    # Retrieval and vector/embedding utilities
  supabase/               # Browser/server/middleware clients
supabase/
  migrations/             # SQL migrations
scripts/
  *.ts                    # Seed/setup utility scripts
```

## Core Flows

### Authentication
- Google OAuth via Supabase
- Callback route exchanges code and redirects into app
- Middleware protects authenticated routes

### Knowledge Ingestion + Chat
- Upload documents/signals
- Extract + embed content
- Retrieve relevant context for prompts
- Stream AI responses in workspace chat

### Product Intelligence
- Detect market and user opportunities
- Generate synthesized insights and themes
- Build PRDs and planning artifacts
- Support prioritization workflows for product decisions

## Deployment (Vercel)

1. Import repo into Vercel
2. Set environment variables from `.env.example`
3. Ensure `NEXT_PUBLIC_APP_URL` matches deployment URL
4. Ensure Supabase redirect URLs include:
   - `https://<your-domain>/auth/callback`
5. Redeploy after env or auth config changes

## Optional: Billing Setup

If you decide to add payments later:
- configure Stripe keys
- run `npm run stripe:setup`
- add generated price IDs
- set webhook secret for `/api/stripe/webhook`
- apply `supabase/migrations/006_subscriptions.sql`

## Scripts

Common scripts (see `package.json`):
- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - run built app
- `npm run demo-pdf` - generate sample demo PDF

## Contributing

1. Create a feature branch
2. Make changes with clear commits
3. Run build/tests locally
4. Open a PR with context and screenshots where applicable

## License

Add your preferred license file (`MIT`, `Apache-2.0`, etc.) if you want open-source reuse terms to be explicit.
