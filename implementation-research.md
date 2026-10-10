# BEEP implementation notes

## JavaScript automation packages

- Admin-approved package source is a `.js` module stored as a private Supabase Storage object. Database rows contain only object path, file name/type/size, expiry/deletion metadata, redemption state, and optional declarative workflow steps; the delivery RPC whitelists these fields and does not copy JavaScript source into JSON metadata.
- The current v1 tabular package contract is `function run(rows, file_name) { ... }` in a plain `.js` file (no imports/exports), returning a JSON-compatible value. The first Excel/CSV sheet is parsed locally into row objects before the call. This implementation detail does not restrict what task or file type a customer may request.
- Downloaded source is encrypted on-device with TweetNaCl secretbox; native key material lives in Expo SecureStore with device-only accessibility. Ciphertext is kept in app storage. In the web preview the key is memory-only because browsers do not expose the same device keystore contract.
- The native execution target is the device's built-in WebView JavaScript engine; the web preview uses a trusted local bridge iframe. Admin source is executed only inside a fresh Worker (no DOM, app bridge, or parent-frame access); the Worker disables network APIs, the host applies restrictive Content Security Policy (`connect-src 'none'`, blob-only Worker source), and terminates the Worker after the result or 60-second timeout. No remote interpreter or runtime bootstrap is downloaded.
- The v1 app passes only locally parsed rows and the file name to the sandbox. The selected working workbook and generated report stay on-device. Current custom-package execution supports Excel `.xlsx`/`.xls` and `.csv`; Word/PDF and other formats may be requested and samples may be attached for admin review, but this runtime version does not execute them yet. Add future formats through tested local parsers/adapters and a versioned input contract when needed, preserving v1 package compatibility and the same sandbox/privacy boundaries.
- The browser runtime is exercised in the Sandbox preview. A real iOS and Android device smoke test is still required before representing native platform behavior as device-verified; embedded WebView/Worker support may vary on outdated system WebViews.

## Backend privacy and retention

- Supabase Storage private buckets/RLS and short-lived signed URLs: https://supabase.com/docs/guides/storage/buckets/fundamentals
- Supabase scheduled Edge Function invocation and Vault-stored secret guidance: https://supabase.com/docs/guides/functions/schedule-functions
- Supabase `pg_net`: https://supabase.com/docs/guides/database/extensions/pg_net
- Optional customer samples and admin JavaScript packages remain private and temporary. Unredeemed files expire after 30 days; after first redemption, the package and request sample expire after seven days. The hourly cleanup removes object bytes and clears paths while preserving non-content metadata.
