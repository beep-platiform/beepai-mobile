# BEEP AI — Mobile app

This repository contains the BEEP customer app: an Expo SDK 54 / React Native / TypeScript app using Expo Router. Customers submit automation requests, redeem admin-approved packages, and run JavaScript automations locally on files they choose. **The customer's working workbook and results stay on the device.**

## Start here

- [BEEP project rules](BEEP_PROJECT_RULES.md) — privacy, file handling, runtime, storage and retention contract. Follow these before changing code.
- [Development guide](DEVELOPMENT.md) — step-by-step instructions for continuing work in this repository.
- [Project handoff/status](PROJECT_STATUS.md) — what's complete, what's not device-verified yet, and deferred work.
- Separate admin website repository: [`beep-platiform/beepai-website`](https://github.com/beep-platiform/beepai-website).

## Local development

Use Node.js/npm compatible with the committed lockfile. Do not commit credentials.

```bash
npm ci
npm run check
npm test
npx expo start
```

For the browser preview:

```bash
npx expo start --web
```

For an internal Android preview build (requires EAS access and the existing project configuration):

```bash
npx eas-cli build --platform android --profile preview
```

The `preview` profile in `eas.json` creates an internal-distribution build. After native code changes, install a new build on a device; the browser preview is not proof of native Android/iOS behavior.

### App environment

`app.config.ts` reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Use the public/anon client key only; never put a Supabase service-role key in the app, logs, source, or repository. Obtain development values through the team's approved secret-management channel and keep local env files untracked.

## Where to work

| Area | Main files |
| --- | --- |
| Home/action-based assistant | `app/(tabs)/index.tsx` |
| Customer request and optional sample picker | `app/create.tsx`, `lib/beepai-supabase.ts`, `lib/sample-file-integrity.ts` |
| Redeem package | `app/redeem.tsx`, `lib/beepai-supabase.ts` |
| Encrypted package storage | `lib/secure-automation-packages.ts` |
| Local workbook parsing and run flow | `app/run/[id].tsx`, `lib/automation-engine.ts` |
| JavaScript isolation/runtime | `lib/javascript-runtime*.tsx`, `lib/javascript-runtime-html.ts`, `lib/javascript-runtime-context.tsx` |
| App state and automation models | `lib/beepai-context.tsx`, `lib/beepai-data.ts` |
| Shared backend schema | `supabase/migrations/` |

## Routine checks

```bash
npm run check
npm test
```

Add or update tests when changing upload verification, code redemption, package encryption, local parsing, or sandbox boundaries. Prefer synthetic fixtures containing a distinctive populated final column; never use a customer's actual working payroll file as a test upload.

## Cross-repository changes

The admin website and mobile app are separate projects. Mobile UI/runtime code belongs here. Shared Supabase migrations and Edge Function sources are carried in both repositories; when changing those, add a forward-only migration and keep matching backend source files synchronized in both repositories. Do not change retention, Storage visibility, RLS, or allowed file types as a side effect of unrelated work.
