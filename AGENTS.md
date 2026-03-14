# AGENTS.md
> Living instruction file for Codex and all sub-agents in this repository.
> Read this file fully before starting ANY task. Update `/doc` files as you work.
> Last section: Escalation rules — read before stopping on any blocker.

---

## 🗂️ Context Management — `/doc` Folder (Read First, Always)

Before starting any task, read the following files in `/doc/` to understand current project state:

| File | Purpose |
|---|---|
| `/doc/PRD.md` | Product requirements and feature specs |
| `/doc/TASKS.md` | Master task list with status (`[ ]` todo, `[x]` done, `[~]` in-progress, `[!]` blocked) |
| `/doc/PROGRESS.md` | Timestamped log of completions per session |
| `/doc/BLOCKERS.md` | Open blockers requiring human input — check before starting |
| `/doc/CHANGELOG.md` | All significant code or schema changes per session |
| `/doc/DECISIONS.md` | Architecture and design decisions + reasoning |
| `/doc/SCHEMA.md` | Supabase table schemas, RLS policies, migration history |

**After completing any task:**
1. Mark it `[x]` in `TASKS.md` with timestamp
2. Append a one-line entry to `PROGRESS.md`: `[YYYY-MM-DD HH:MM] <agent> — <what was done>`
3. Update `CHANGELOG.md` if code or schema changed
4. Log new decisions in `DECISIONS.md` with rationale

**If `/doc` does not exist**, create the folder and stub all files above before writing any code.

**New session start prompt** (paste this at the start of every new Codex session):
```
Read /doc/TASKS.md, /doc/PROGRESS.md, and /doc/BLOCKERS.md.
Summarise where we left off, what is in progress, and what is blocked.
Then continue with the next uncompleted task.
```

---

## 🤖 Multi-Agent Architecture

This project uses a **coordinator + specialist subagent** model. The root Codex session is the **Project Coordinator**. It decomposes work, spawns specialist subagents via skills, verifies deliverables, and gates handoffs.

### Enabling Multi-Agent in Codex

Add to `~/.codex/config.toml`:
```toml
[experimental]
multi_agent = true
```

Codex handles spawning, routing, and result collection automatically. Subagents inherit the parent sandbox and approval policy.

### Agent Role Definitions (`.codex/config.toml` at project root)

```toml
[agents.frontend]
description = "Handles all UI, component, and styling work. Next.js App Router, Tailwind CSS, shadcn/ui."
config_file = ".codex/agents/frontend.toml"

[agents.backend]
description = "Handles API routes, Server Actions, Supabase queries, and database migrations."
config_file = ".codex/agents/backend.toml"

[agents.tester]
description = "Runs Vitest unit tests and triggers E2E tests via agent-browser skill."
config_file = ".codex/agents/tester.toml"

[agents.reviewer]
description = "Reviews diffs for correctness, type safety, security, and convention compliance."
config_file = ".codex/agents/reviewer.toml"
```

Agent role config files live in `.codex/agents/`. Example for the reviewer (read-only, fast):

```toml
# .codex/agents/reviewer.toml
model = "codex-mini"
reasoning_effort = "low"

[sandbox]
mode = "read-only"
```

---

## 🧩 Skills — Repeatable Specialist Workflows

Skills live in `.agents/skills/` and are checked into the repo. Codex uses **progressive disclosure** — it loads only the skill name and description at startup, then loads the full `SKILL.md` only when triggered.

### Skill Directory Structure

```
.agents/skills/
├── frontend-design/
│   ├── SKILL.md
│   ├── agents/openai.yaml
│   └── references/
│       ├── component-patterns.md
│       └── tailwind-conventions.md
├── db-migration/
│   ├── SKILL.md
│   └── references/
│       └── rls-patterns.md
├── api-endpoint/
│   └── SKILL.md
├── pr-review/
│   └── SKILL.md
├── agent-browser/
│   └── SKILL.md
└── new-session/
    └── SKILL.md
```

### SKILL.md Format

```markdown
---
name: frontend-design
description: >
  Use for any new UI page, component, layout, or visual iteration.
  Triggers on: "build a page", "create a component", "style this", "redesign the UI".
  Does NOT trigger for: API routes, database work, test writing, migrations.
allow_implicit_invocation: true
---

# Frontend Design Skill
[Full instructions — only loaded into context when this skill is triggered]
```

### `agents/openai.yaml` Format

```yaml
name: frontend-design
description: Specialist for Next.js UI, Tailwind CSS, and shadcn/ui component work.
invocation:
  policy: implicit
tools:
  - type: file_read
  - type: file_write
  - type: shell
```

Set `policy: explicit` for skills that should only run when `$skill-name` is typed directly (e.g. `$pr-review`).

---

## 🧑‍💼 Subagent Roster & Invocation Rules

**Explicit invocation**: type `$skill-name` anywhere in your prompt
**Implicit invocation**: Codex auto-selects the skill when the task matches its description
**List available skills**: run `/skills` in the Codex CLI

| Skill | Invoke With | Auto-triggers On | Writes To |
|---|---|---|---|
| `$frontend-design` | `$frontend-design build the dashboard` | Any UI, page, component, or styling task | `app/`, `components/` |
| `$db-migration` | `$db-migration add user_profiles table` | New tables, schema changes, RLS policies | `supabase/migrations/`, `/doc/SCHEMA.md` |
| `$api-endpoint` | `$api-endpoint create POST /api/invite` | New API route, Server Action, data mutation | `app/api/`, `app/actions/` |
| `$agent-browser` | `$agent-browser test the login flow` | After any frontend change | `tests/e2e/` |
| `$pr-review` | `$pr-review` | Explicit only — when work is ready to commit | `/doc/CHANGELOG.md` |
| `$new-session` | `$new-session` | Start of every new Codex session | Reads `/doc`, outputs state summary |

---

## 📋 Coordinator (Root Codex) Workflow

The root Codex session **orchestrates** — it does not write production code when a specialist skill exists for the job.

```
1. READ    → /doc/TASKS.md, /doc/BLOCKERS.md (resolve blockers first)
2. PLAN    → decompose current task into specialist subtasks
3. SPAWN   → invoke skills in the correct dependency order (see below)
4. VERIFY  → confirm deliverable files exist on disk before next handoff
5. TEST    → invoke $agent-browser or $tester after any code change
6. REVIEW  → invoke $pr-review before committing
7. LOG     → update /doc/TASKS.md, /doc/PROGRESS.md, /doc/CHANGELOG.md
8. COMMIT  → run pre-commit checks, then commit with conventional message
```

### Dependency Order (Sequential Gates)

These must complete in order — never skip a gate:

```
$db-migration  →  $api-endpoint  →  $frontend-design  →  $agent-browser  →  $pr-review
```

### Parallel Execution (Safe to Run Simultaneously)

```
$frontend-design  ║  $api-endpoint    (UI and API can build together after schema is stable)
$pr-review        ║  $tester          (review and test simultaneously)
```

---

## 🤝 Handoff Protocol

Every subagent must write a **handoff record** to `/doc/PROGRESS.md` before returning control to the coordinator.

### Handoff Record Format

```
[2025-06-01 14:32] $frontend-design — Built settings page
  Output files:
    + app/(dashboard)/settings/page.tsx
    + components/settings/ProfileForm.tsx
  Checks passed: pnpm lint ✓  pnpm typecheck ✓
  Next handoff to: $agent-browser — test profile update flow
```

**Coordinator rule**: verify each listed file exists on disk before spawning the next agent. If a file is missing, write to `/doc/BLOCKERS.md` and stop.

### Handoff Verification Script

```bash
for file in "$@"; do
  [ -f "$file" ] || { echo "MISSING: $file" && exit 1; }
done
echo "All deliverables verified ✓"
```

---

## 🏗️ Tech Stack (Canonical — Do Not Deviate)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 — strict mode, no `any` |
| Database + Auth | Supabase (Postgres, RLS, SSR auth via `@supabase/ssr`) |
| Styling | Tailwind CSS v4 — mobile-first |
| Components | shadcn/ui + Radix UI primitives |
| Forms | React Hook Form + Zod |
| Server state | TanStack Query v5 |
| URL state | `nuqs` |
| Package manager | `pnpm` — never npm or yarn |
| Deployment | Vercel (Edge middleware, Node runtime for heavy routes) |
| Testing (unit) | Vitest |
| Testing (E2E) | Playwright via `$agent-browser` |
| Schema validation | Zod — define first, infer TS types with `z.infer<>` |

---

## 📁 Project Structure

```
/
├── .agents/
│   └── skills/                       ← All project skills (checked into git)
├── .codex/
│   ├── config.toml                   ← Multi-agent role definitions
│   └── agents/                       ← Per-agent config overrides
│       ├── frontend.toml
│       ├── backend.toml
│       ├── tester.toml
│       └── reviewer.toml
├── app/
│   ├── (auth)/                       ← Public: login, register, reset-password
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  ← Protected: all authenticated routes
│   │   ├── layout.tsx                ← Session check + redirect guard
│   │   └── [feature]/
│   │       ├── page.tsx              ← RSC data fetch
│   │       └── _components/          ← Co-located private components
│   ├── api/                          ← Server-side mutations only
│   │   └── [...route]/route.ts
│   ├── layout.tsx                    ← Root layout (fonts, providers)
│   ├── page.tsx                      ← Landing / root redirect
│   ├── loading.tsx
│   ├── error.tsx
│   └── not-found.tsx
├── components/
│   ├── ui/                           ← shadcn/ui (auto-generated, do not hand-edit)
│   └── [feature]/                    ← Feature-scoped shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← createBrowserClient
│   │   ├── server.ts                 ← createServerClient + cookies()
│   │   └── middleware.ts             ← updateSession()
│   ├── validations/                  ← Zod schemas (source of truth for all types)
│   └── utils.ts                      ← cn(), formatters, helpers
├── hooks/                            ← Client-side custom hooks only
├── types/
│   ├── index.ts                      ← Shared domain types
│   ├── supabase.ts                   ← Generated Supabase DB types
│   └── env.d.ts                      ← Env var type declarations
├── middleware.ts                     ← Supabase session refresh (root level)
├── supabase/
│   ├── migrations/                   ← Timestamped .sql files
│   └── seed.sql                      ← Dev seed data
├── tests/
│   ├── unit/                         ← Vitest specs (co-located preferred)
│   └── e2e/                          ← Playwright specs ($agent-browser)
├── public/                           ← Static assets
├── doc/                              ← Context management (agent memory)
│   ├── PRD.md
│   ├── TASKS.md
│   ├── PROGRESS.md
│   ├── BLOCKERS.md
│   ├── CHANGELOG.md
│   ├── DECISIONS.md
│   └── SCHEMA.md
├── .env.local                        ← gitignored — real secrets
├── .env.example                      ← committed — blank values template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔷 TypeScript Standards

- `"strict": true` in `tsconfig.json` — non-negotiable
- No `any` — use `unknown`, narrow with Zod or type guards
- No `!` non-null assertions — handle nulls explicitly
- Infer types from Zod: `type MyType = z.infer<typeof MySchema>`
- Path alias: always `@/` (maps to project root)
- Boolean names: `isLoading`, `hasError`, `canSubmit`, `shouldRefetch`
- File order: exported component → subcomponents → helpers → static values → types

---

## ⚛️ Next.js Conventions

- Default to **RSC** — `'use client'` only for state, events, or browser APIs
- No `useEffect` for data fetching — use RSC or TanStack Query
- Mutations → Server Actions for simple CRUD; `/app/api/` for complex logic
- Wrap async client boundaries in `<Suspense>` with skeleton fallbacks
- Images: always `<Image>` from `next/image` with `width`, `height`, `alt`
- Export `metadata` from every page file
- Dynamic imports for heavy non-critical components: `next/dynamic`
- Route groups `(auth)` / `(dashboard)` — never mix public and protected routes

---

## 🔐 Supabase Standards

- Server components → `lib/supabase/server.ts` (`createServerClient` + `cookies()`)
- Client components → `lib/supabase/client.ts` (`createBrowserClient`)
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to client code** — server/API routes only
- `middleware.ts` must call `updateSession()` on every request
- RLS **enabled on every table** — no exceptions
- SELECTs use RLS; complex mutations route through Server Actions with service role
- RLS performance: use `(select auth.uid())` not bare `auth.uid()` in policies
- All schema changes in `supabase/migrations/YYYYMMDDHHMMSS_name.sql`
- Document every schema change in `/doc/SCHEMA.md`
- Supabase auth callback route: `app/auth/callback/route.ts`

---

## 🎨 UI & Styling (always via `$frontend-design`)

- Tailwind only — no inline styles, no CSS Modules
- Mobile-first: base styles first, `md:` / `lg:` / `xl:` breakpoints after
- shadcn/ui for common elements — `pnpx shadcn@latest add [component]`
- `cn()` from `lib/utils.ts` for conditional class merging
- Dark mode via shadcn CSS variable theming
- Loading states: always `<Skeleton>` — never blank screens
- Error states: always render error UI — never silent failures
- Accessibility: semantic HTML, ARIA labels, keyboard navigation
- Components under ~150 lines — extract subcomponents if longer

---

## ✅ Testing Standards

### Unit Tests (Vitest) — `$tester`
- Co-locate: `[name].test.ts` or place in `tests/unit/`
- Run: `pnpm test`
- Cover: utilities, Zod schemas, Server Actions, API handlers
- Minimum: happy path + one error path per function

### E2E Tests (Playwright) — `$agent-browser`
- Specs in `tests/e2e/`
- Run: `pnpm test:e2e`
- Cover: auth flows, critical user journeys, form submissions

### Pre-commit Checks (all must pass before any commit)
```bash
pnpm lint        # ESLint
pnpm typecheck   # tsc --noEmit
pnpm test        # Vitest
```

---

## 🌿 Git Conventions

### Conventional Commits
```
<type>(<scope>): <description>

Types:  feat | fix | chore | refactor | docs | test | style | perf
Scopes: auth | db | ui | api | config | doc | agents

Examples:
feat(ui): add dashboard layout with sidebar nav
fix(db): correct RLS policy on profiles table
chore(config): add Vitest and Playwright setup
docs(doc): initialise PRD and TASKS for hackathon
```

### Branch Naming
```
feat/<short-description>
fix/<short-description>
chore/<short-description>
```

---

## ⚙️ Environment Variables

`.env.local` (gitignored) must contain:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-side only — never expose to client
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`.env.example` (committed) mirrors the above with blank values as documentation.

---

## ⚙️ State Management

| State type | Solution |
|---|---|
| Server / async data | TanStack Query v5 |
| URL / filter params | `nuqs` |
| Local UI state | `useState` / `useReducer` |
| Global client state | Zustand (use sparingly) |
| Form state | React Hook Form + Zod resolver |

---

## 🚫 Anti-Patterns

| Never | Instead |
|---|---|
| Use `any` | `unknown` + Zod narrowing |
| Fetch in `useEffect` for initial data | RSC or TanStack Query |
| Service role key in client code | Server Actions / API routes only |
| Skip RLS on any table | Enable RLS everywhere, always |
| Use `npm` or `yarn` | Always `pnpm` |
| Leave TODO comments in code | Create a task in `TASKS.md` |
| Coordinator writes UI code directly | Spawn `$frontend-design` |
| Skip handoff record | Write to `/doc/PROGRESS.md` first |
| Guess past a blocker | Log to `BLOCKERS.md`, stop, surface to human |
| Proceed without verifying deliverables | Run handoff verification before spawning next agent |
| Mix public and protected routes | Use route groups `(auth)` and `(dashboard)` |
| Hand-edit `components/ui/` | Only add via `pnpx shadcn@latest add` |

---

## 🔒 Security Baseline

- Never commit secrets — `.env.local` is gitignored; commit only `.env.example`
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client or browser
- Validate all inputs with Zod **before** any DB write
- Sanitize user content — avoid `dangerouslySetInnerHTML`
- Rate limit all public API routes (Vercel Edge middleware or Upstash)
- Auth callback route must exchange code for session server-side only

---

## 🆘 Escalation Rules

Stop and log to `/doc/BLOCKERS.md` when:
- Requirements in `PRD.md` are ambiguous
- A test failure cannot be resolved within the current task
- A migration would conflict with existing schema
- An environment variable is missing or misconfigured
- A subagent deliverable is absent after expected completion

### Blocker Entry Format
```
[YYYY-MM-DD HH:MM] BLOCKER — <agent that hit it>
Problem:   <what failed or is unclear>
Attempted: <what was tried>
Needs:     <what human input is required>
```

**Never guess past a blocker. Never fake a missing env value. Surface it and stop.**
