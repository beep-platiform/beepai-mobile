# BEEP Mobile — Project handoff

**Status as of:** 2026-10-10  
**Repository:** `beep-platiform/beepai-mobile` (`main`)  
**Mobile application code baseline:** `aff9887` (50 MB sample upload cap). Documentation updates do not change application code.

Read [BEEP_PROJECT_RULES.md](BEEP_PROJECT_RULES.md) before continuing. This handoff supersedes older, incomplete status checkboxes in `todo.md`; that legacy file was not edited as part of this handoff.

## Completed

- Customer app has an action-based home screen and Expo Router flows for **Request → Redeem → Run**.
- Customers can send request metadata and explicitly attach an optional private sample. The uploader passes the selected `File` or `ArrayBuffer` directly to private Supabase Storage; it does not parse and regenerate an Excel workbook.
- Sample uploads have a **50 MiB cap (52,428,800 bytes)**. Before a request is recorded, the app measures the exact upload body and rejects empty, oversized, or picker-size-mismatched files. The measured size is stored as metadata. Regression tests cover exact bytes, mismatch, empty files, and the 50 MiB boundary.
- Customers redeem a 24-character high-entropy package code; the Edge Function issues a short-lived signed URL. Downloaded `.js` source is encrypted locally before storage.
- Native encryption uses TweetNaCl secretbox with key material in Expo SecureStore. The SecureStore key name was corrected to use allowed characters. Browser preview keys are memory-only.
- Workbook parsing and automation execution are local. The supported custom automation contract is `function run(rows, file_name)`; no module imports/exports. Excel/CSV input is parsed locally; Word/PDF are samples for admin review, not current execution inputs.
- JavaScript runs in the isolated Worker-based WebView/iframe runtime with network/DOM/app-bridge access blocked, bounded input/output and execution time, and worker termination after each run.
- The sample/package retention cleanup, private buckets, redemption approval gate, and synchronized backend migrations are present. A narrowly scoped `service_role` SELECT permission was added to fix server-side redemption metadata lookup.
- Chat/home content is scrollable. TypeScript and unit tests passed after the 50 MiB change (6 passed, 1 skipped).
- A previously attached sample's recorded size and Storage object size matched (7,174 bytes). This was a byte-count check only, not a content hash or complete workbook inspection.

## Open / not yet verified on a physical device

1. **Build and install a fresh Android preview** from the current `main`; later source changes are not in an already-installed build:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
2. On a real Android device, smoke-test request with an optional redacted sample, redemption, encryption, local Excel/CSV execution, and report display. Validate native Worker/WebView behavior. iOS native behavior also needs a device smoke test before claiming it is verified.
3. Validate the reported missing-final-column concern with a synthetic workbook whose last column contains known values. If examining a customer sample, use only the explicitly attached sample and compare the original against the downloaded private object; never upload the actual working workbook used for a payroll run. Byte-size equality alone does not prove content equality.
4. Exercise the 50 MiB boundary using synthetic data and ensure both the client and private Storage bucket reject files above the cap.

## Product format scope and current runtime version

Customers may request automations for the file types and tasks they need; Excel, Word, PDF, CSV, and other formats are not product-level exclusions. The currently implemented custom JavaScript package v1 accepts locally parsed Excel/CSV rows through `run(rows, file_name)`. Word/PDF and other formats are not executable in this app version yet. Future support requires task-specific local parsers/adapters, bounded inputs/outputs, tests, and a versioned contract where needed, while preserving existing v1 packages and the local-only data boundary. Do not promise a format until implemented and verified on relevant platforms.

## Deferred by product owner

- **Visual redesign/polish:** owner said the current interface looks worse and would be handled later. Do not silently expand this task into a redesign.

## Current boundary / reminders

- A fresh build is needed for mobile source changes; the browser preview is not equivalent to the native secure store.
- The most recent “Ndashaka automation” request had no optional sample attached. Do not assume every request contains a workbook.
- Do not promise cloud deletion at the exact expiry instant: the hourly cleanup removes expired bytes on its next run.
- No active code change is recorded as in progress beyond this handoff; the concrete next action is device validation.

## Handoff maintenance — required for every developer/AI

This file is the living handoff. Before stopping any future task/session, update it with the date; work completed; exact current/stopping point; checks run and checks still needed; blockers/owner decisions; and next concrete actions in priority order. Note changed files and commit status/hash where useful. Include this for partial or blocked work too, but never put secrets, redemption codes, customer contact details, sample contents, or payroll results here. Remove or mark completed obsolete next steps so the next contributor is not misled. If shared backend changes affect both repositories, update both project status files.

### Latest session handoff

- **Completed:** Clarified in both shared rules/development guides that customers may request any suitable task/file type; the rows/file-name interface is current v1 only. Updated mobile Security & Help copy to accurately describe local working-file privacy without claiming Word/PDF execution exists. Updated technical research notes.
- **Stopping point:** The policy, technical notes, customer copy, and handoff update are pushed in mobile commit `df2dc09` (website mirror `be79d36`). No parser, package contract, or runtime support for new formats was implemented in this task.
- **Checks:** Mobile TypeScript check and tests passed (6 passed, 1 skipped); `git diff --check` passed in both repos; Markdown relative links resolve; shared rules are byte-for-byte identical.
- **Next:** Design an extensible local input-adapter/contract plan before implementing a requested non-tabular format, preserving the current v1 package contract. Keep physical Android file-upload/redemption/run validation as a separate open item. Update both handoffs before stopping again.
