# BEEP project rules — privacy, files, packages, and execution

These rules are the shared product/security contract for the mobile app and admin website. If a requested change conflicts with them, pause and clarify with the project owner before proceeding.

## Data boundary

- Supabase is the control/metadata layer: request descriptions/status, contact details, account/license/subscription metadata, redemption state, private Storage object references, file name/type/size, expiry/deletion timestamps, and non-content workflow metadata.
- Do not store customer working files, payroll data, run results, or permanent automation source code in database rows.
- The user's actual working files and calculated results stay on the user's device. Never upload the working workbook selected for a later run.
- Customers may request an automation for the task and file types that fit their needs; Excel, Word, PDF, CSV, and other formats are not product-level exclusions. The implementation must assess the specific task, format, and platform support before promising delivery. Only an optional sample the customer explicitly attaches may leave the device for admin review. Tell the customer it is private but visible to authorized admins; recommend redacting sensitive values.

## Private temporary file exceptions

1. **Customer sample:** private Supabase Storage object, uploaded only by explicit attachment. Maximum size is **50 MiB / 52,428,800 bytes**. Preserve the original bytes; do not parse and re-save the file during upload. Compare actual body size to picker-reported size and record measured bytes. Keep the existing accepted MIME types and private permissions unless the owner explicitly approves a separate change.
2. **Approved automation package:** an authorized admin may attach the approved plain `.js` artifact to a request for delivery. Store it as a private Storage object, not as source text in the database. The current package file cap is 1 MiB.

## Retention and downloads

- Unredeemed request samples and unredeemed package files expire after 30 days.
- On first successful redemption, the package and associated request sample expire seven days after redemption.
- An hourly server-side cleanup deletes expired object bytes and clears their database object paths, retaining non-content metadata and expiry/deletion state. Never promise removal before the next cleanup run after expiry.
- Keep buckets private; provide short-lived signed URLs (currently 120 seconds). Redemption codes are high-entropy 24-character bearer credentials. Never implement guessable phone-number lookup or expose codes in ordinary metadata queries/logs.
- Do not widen Storage policies, database grants, or admin roles casually. Browser/native clients use the public/anon key with RLS; service-role access is server-side only.

## JavaScript package and local execution

- **Current v1 tabular contract:** an approved plain `.js` file defines `function run(rows, file_name)` (no `import`/`export`), receives locally parsed rows from the first Excel/CSV sheet plus the file name, and returns JSON-compatible output. This is the current implementation, not a permanent limit on which automations customers may request.
- For a new task/file format (including Word, PDF, or other types), first verify it can be handled within the device/browser and sandbox constraints. If needed, design a versioned input contract and a local parser/adapter for that format; keep the existing v1 contract working for existing packages. Do not promise or mark a format supported until the parser, UI, bounded input/output, tests, and relevant native-platform behavior are implemented and verified.
- Parse all working inputs locally using the task-specific supported adapter. Only an explicitly attached sample is uploaded. Never transmit a customer's selected working file or report for execution.
- Run the approved code in a fresh dedicated JavaScript Worker in the restricted WebView/iframe runtime. No DOM, app bridge, or network access; bounded input/output and execution time; terminate after each run. Use the device/browser's built-in JavaScript engine—do not install/download a separate interpreter.
- Encrypt downloaded JavaScript on-device using the existing design. Native key is held in Expo SecureStore (device-held key); web-preview key is memory-only. In web preview, a reload/closed session requires redeeming again while the package remains available. Do not describe browser storage as equivalent to native secure storage.
- Current custom-package v1 run inputs are Excel `.xlsx`/`.xls` and CSV. Word/PDF and other formats may be requested and may be attached as samples for admin review, but they are not yet executable by this version. State this current implementation limit honestly while treating requested formats as candidates for future local support, not as forbidden product scope.

## Repository and change discipline

- `beepai-mobile` and `beepai-website` are separate repositories; do not merge app and admin code into one project.
- Both repositories carry Supabase schema migrations and relevant Edge Function sources. Keep shared backend files byte-for-byte synchronized. Add forward-only migrations; do not rewrite historical migrations to change a deployed schema.
- Before changing file caps or lifecycle behavior, update and verify the mobile validator, Storage bucket migration/live configuration, tests, and documentation together. A file cap change must not silently change the private/public setting, MIME allowlist, retention, or package cap.
- Never commit credentials, bearer codes, sample contents, customer contact details, or payroll results. Use synthetic fixtures for tests and keep secrets out of client bundles and logs.
- Keep customer-facing copy accurate about what is uploaded, who may inspect samples, retention, execution location, and browser-preview limitations.

## Required session handoff

- Every developer or AI working in either repository must update that repository's `PROJECT_STATUS.md` before stopping work, ending a task, or handing the work to someone else. Do this even when the work is partial, blocked, or documentation-only.
- Record the date, completed work, current state and exact stopping point, validation performed (and what was not verified), blockers/decisions needed, and the next concrete action(s) in priority order. Identify changed/uncommitted files or the commit hash when relevant. Never include secrets, bearer codes, customer data, or file contents.
- If shared backend files changed, update both repositories' handoffs and keep shared code/migrations synchronized. Commit the handoff update with the related change when possible; do not claim a change is finished if it is only planned.
- The handoff is a living status record: replace obsolete “next steps” when progress changes, and mark work complete only after verification. Keep `PROJECT_STATUS.md` authoritative over legacy TODO lists.
