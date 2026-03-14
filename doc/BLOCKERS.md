# BLOCKERS
[2026-03-14 16:55] BLOCKER - Codex
Problem:   Supabase migration history is out of sync with existing schema objects; CLI now requires database-password auth and returns `FATAL: Circuit breaker open ... set SUPABASE_DB_PASSWORD`.
Attempted: Linked project with access token, ran `pnpm db:migrate` (failed because enum/type already exists), regenerated remote types, attempted migration repair/list (partially repaired one version, then blocked by DB-password requirement).
Needs:     Provide `SUPABASE_DB_PASSWORD` so migration history can be repaired cleanly (`supabase migration repair`) and `pnpm db:migrate` can complete without replaying already-applied SQL.
<!-- Format: [YYYY-MM-DD HH:MM] BLOCKER - <agent> | Problem: | Attempted: | Needs: -->
