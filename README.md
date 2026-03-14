# Compass

AI-powered product management workspace for PMs. Upload docs → chat naturally → generate structured PM artifacts.

## Tech Stack

- **Next.js 15+** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Vercel AI SDK** (streaming, tool calls)
- **LangChain.js** (RAG)
- **Supabase** (Auth, Storage, pgvector)
- **TipTap** (editable Markdown)
- **Mermaid.js** (roadmap diagrams)

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   - Create a project at [supabase.com](https://supabase.com)
   - Enable Google OAuth in Authentication → Providers
   - Copy Project URL and anon key from Settings → API
   - Update `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Configure AI** (optional for now)

   ```
   ANTHROPIC_API_KEY=your_key
   # or
   OPENAI_API_KEY=your_key
   ```

4. **Run**

   ```bash
   npm run dev
   ```

5. **Supabase database** (for full MVP)

   Run the SQL from `supabase/migrations/` to create workspaces, documents, and vector tables. (Coming in next steps.)

## Project Structure

```
/app
  /(auth)        - login, callback
  /(dashboard)   - main workspace (sidebar + chat + output)
/api             - route handlers (e.g. /api/chat)
/components
  /layout       - AppSidebar, ChatArea, OutputPane
  /providers    - AuthProvider, PromptProvider
  /ui           - shadcn components
/lib
  /supabase     - client, server, middleware
```

## MVP Features (in progress)

- [x] Google OAuth via Supabase
- [x] Basic layout: Sidebar + Chat + Output pane
- [x] Quick Actions (Synthesize Research, Prioritize, Roadmap, PRD, Stakeholder Update)
- [ ] File upload → text extraction → embedding → pgvector
- [ ] RAG chain for chat
- [ ] Streaming AI responses
- [ ] Editable outputs (TipTap)
- [ ] Export (MD/PDF/copy)
