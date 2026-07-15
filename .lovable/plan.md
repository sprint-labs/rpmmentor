# Automated tests for gk-media bucket access

Add a Vitest suite that hits the real backend using `@supabase/supabase-js` and asserts the current policies on `storage.objects` for the private `gk-media` bucket.

## Policies under test (from migrations)

- `anon`: no policies → cannot list, read, upload, update, or delete.
- `authenticated`: SELECT any object, INSERT/UPDATE any object in `gk-media` (must be signed in), DELETE only if `owner = auth.uid()` OR has `admin`/`super_admin` role.
- `super_admin`: everything authenticated can do, plus DELETE of any object (including files owned by other users).

## Test file

`src/lib/storage/gk-media.test.ts` — a single Vitest suite with three `describe` blocks.

Uses the publishable/anon key from `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` (already in `.env`). Signs in via `signInWithPassword` using test credentials from env vars:

- `TEST_MENTOR_EMAIL` / `TEST_MENTOR_PASSWORD` — existing mentor account
- `TEST_SUPER_ADMIN_EMAIL` / `TEST_SUPER_ADMIN_PASSWORD` — Luke's account

If either credential pair is missing, that block is skipped with `describe.skip` and a console warning so the anon block still runs in CI.

### Assertions

**anon (unauthenticated client)**
- `storage.from('gk-media').list('')` → returns empty array or error (no rows visible).
- `storage.from('gk-media').upload(path, blob)` → error (RLS denies).
- `storage.from('gk-media').download(seededPath)` → error.
- `storage.from('gk-media').remove([seededPath])` → error / no-op.

**authenticated (mentor)**
- `list('')` → success (array).
- `upload('test/<uuid>.txt', blob)` → success. Path saved for cleanup.
- `download(ownPath)` → success, bytes match.
- `remove([ownPath])` → success (owner delete allowed).
- Attempt to `remove([otherUserPath])` seeded by super_admin block → error / count 0.

**super_admin (Luke)**
- `upload`, `download`, `list` → success.
- `remove` a file uploaded by the mentor session → success (privileged delete).
- Cleanup: remove any leftover test files under `test/` prefix.

Each block uses `beforeAll` to sign in and `afterAll` to sign out and clean up. Test files use a unique `test/${runId}/...` prefix so parallel runs don't collide.

## Tooling

- Add dev deps: `vitest`, `@vitest/ui` (optional), `jsdom` not needed (node env).
- `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.
- `vitest.config.ts` at project root: node environment, loads `.env` via `loadEnv`, 30s timeout for network calls.
- No changes to app code or migrations.

## Files

```text
vitest.config.ts                       (new)
src/lib/storage/gk-media.test.ts       (new)
package.json                           (scripts + devDeps)
```

## Required user action

Before running tests, add to `.env.local` (not committed):

```
TEST_MENTOR_EMAIL=...
TEST_MENTOR_PASSWORD=...
TEST_SUPER_ADMIN_EMAIL=luke@sprintlabs.uk
TEST_SUPER_ADMIN_PASSWORD=...
```

Without these, only the anon block runs; authenticated / super_admin blocks skip with a clear message.

## Run

`bun run test` — executes once and exits with non-zero on any policy regression.
