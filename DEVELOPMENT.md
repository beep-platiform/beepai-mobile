# Continuing development — Mobile

1. Read [BEEP_PROJECT_RULES.md](BEEP_PROJECT_RULES.md) and [PROJECT_STATUS.md](PROJECT_STATUS.md) before taking work. The status file identifies completed work, device checks still needed, and the design work explicitly deferred by the owner.
2. Make mobile UI/runtime changes in `beepai-mobile`. Make admin UI changes in the separate `beepai-website` repo. When changing shared Supabase migrations or Edge Function sources, update both repositories identically.
3. Keep development credentials out of commits. Mobile expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`; use only the public/anon client credential in the app. Service-role credentials must remain server-side.
4. Install and run checks:
   ```bash
   npm ci
   npm run check
   npm test
   npx expo start
   ```
5. For a browser preview use `npx expo start --web`. For an internal Android build use `npx eas-cli build --platform android --profile preview`. Verify actual native behavior on-device; the browser preview does not provide native SecureStore semantics.
6. For request-sample changes, preserve original bytes, validate measured size against picker-reported size, test 50 MiB boundary conditions, and keep MIME/privacy/retention behavior unchanged unless a separately approved requirement says otherwise. Use synthetic workbooks with a populated final column.
7. The plain `run(rows, file_name)` function is the current v1 tabular (Excel/CSV) contract, not a permanent limit on customer requests. For Word, PDF, or another requested file type, keep execution local and the Worker/WebView boundary intact; design and version a task-specific input contract/local parser adapter, preserve existing v1 packages, and add tests before advertising support. Do not forward working-file contents or calculation results to Supabase.
8. Before pushing, run `npm run check`, `npm test`, and `git diff --check`; review that no secrets, sample content, or unrequested backend settings are included.

Useful implementation paths are listed in [README.md](README.md). The older `todo.md` predates the current private JavaScript delivery work; treat [PROJECT_STATUS.md](PROJECT_STATUS.md) as the current handoff until that legacy file is reconciled.

## Required handoff before stopping

Before ending a task/session or handing work to another person or AI, update `PROJECT_STATUS.md` with the date, what was completed, the exact current/stopping point, checks run and remaining verification, blockers or owner decisions needed, and the next concrete action(s) in priority order. Mention relevant changed files and commit status/hash. Never include secrets, redemption codes, customer details, sample content, or payroll results. This is required for partial and blocked work as well as completed work. If a change touches shared Supabase code/schema, update the website repository's `PROJECT_STATUS.md` too and verify the shared files match. Keep the handoff current; do not leave old next steps appearing active after they are finished.
