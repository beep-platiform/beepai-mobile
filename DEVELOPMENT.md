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
7. For automation-runtime changes, preserve the plain `run(rows, file_name)` contract and isolated Worker/WebView boundary. Do not forward workbook rows or calculation results to Supabase.
8. Before pushing, run `npm run check`, `npm test`, and `git diff --check`; review that no secrets, sample content, or unrequested backend settings are included.

Useful implementation paths are listed in [README.md](README.md). The older `todo.md` predates the current private JavaScript delivery work; treat [PROJECT_STATUS.md](PROJECT_STATUS.md) as the current handoff until that legacy file is reconciled.
