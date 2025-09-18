# Roy Kyagwe Estate — AI Workspace

**Purpose**  
One-repo workspace to think with a planning agent (“partner”) and build with a dev agent (“dev”). All Markdown/YAML under `docs/**` and `bmad-core/**` is synced to Supabase for traceability.

**How to use**  
1) Edit or add files in `docs/` (sessions, file-library) and `bmad-core/` (agents, templates).  
2) Commit & push to **main**.  
3) GitHub Action “Sync Docs to Supabase” updates tables `documents` and `document_revisions`.  
4) Check Supabase Table Editor to verify.

**Local testing (optional)**  
cp .env.example .env # fill SUPABASE_URL and SUPABASE_SERVICE_ROLE
npm ci
npm run sync:dry
npm run sync

markdown
Copy code

**Folders**  
- `docs/` – living notes and the File Library  
- `bmad-core/` – partner/dev agents, templates, tasks, workflows, checklists, data  
- `scripts/` – sync tool (repo → Supabase)  
- `supabase/` – database schema (apply once in SQL Editor)  
- `.github/workflows/` – CI that runs on push to main
