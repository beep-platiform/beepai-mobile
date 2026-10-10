# BEEP Mobile — Project handoff

**Status as of:** 2026-10-10  
**Repository:** `beep-platiform/beepai-mobile` (`main`)  
**Code baseline before this documentation commit:** `aff9887` (50 MB sample upload cap)

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

## Deferred by product owner

- **Visual redesign/polish:** owner said the current interface looks worse and would be handled later. Do not silently expand this task into a redesign.

## Current boundary / reminders

- A fresh build is needed for mobile source changes; the browser preview is not equivalent to the native secure store.
- The most recent “Ndashaka automation” request had no optional sample attached. Do not assume every request contains a workbook.
- Do not promise cloud deletion at the exact expiry instant: the hourly cleanup removes expired bytes on its next run.
- No active code change is recorded as in progress beyond this handoff; the concrete next action is device validation.
