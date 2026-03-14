# BLOCKERS
[2026-03-14 16:30] BLOCKER - Codex
Problem:   Supabase CLI migration apply and remote type regeneration are still blocked because no `SUPABASE_ACCESS_TOKEN` is configured.
Attempted: Ran `pnpm db:migrate` (failed: project not linked), `pnpm db:types` local (failed: Docker unavailable), and remote generation with `--project-id` (failed: access token missing).
Needs:     Provide `SUPABASE_ACCESS_TOKEN` (or apply migration and generate types manually), then rerun migration + type generation.
<!-- Format: [YYYY-MM-DD HH:MM] BLOCKER - <agent> | Problem: | Attempted: | Needs: -->
