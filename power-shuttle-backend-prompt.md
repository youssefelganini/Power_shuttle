# Backend — Power Shuttle

Act as a senior backend developer. Build a simple backend for "Power Shuttle" — a used-car history platform. The frontend (React) already exists: Buyer view (VIN lookup) and Service Center view (repair submission with 3 photo uploads). Keep this as lean as possible — simplicity and low Gemini API token usage matter more than scalability.

Stack: Node.js + Express. Database: SQLite (single file, e.g. better-sqlite3, no ORM needed — raw SQL is fine). File storage: local disk under `/uploads`. Version all routes under `/api/v1/...`.

## Tables

- `vehicles`: vin (PK), verdict, explanation, verdict_updated_at
- `service_records`: id, vin (FK), odometer_km, service_type, insurance_claim, notes, before_photo_path, after_photo_path, invoice_photo_path, created_at

## Endpoints (core, build these)

1. `POST /api/v1/service-records`
   - multipart/form-data: vin, odometer_km, service_type, insurance_claim, notes, before_photo, after_photo, invoice_photo (required)
   - Save photos to `/uploads`, insert record, upsert vehicle row
   - After inserting, call the Gemini analysis function to refresh that vehicle's cached verdict
   - Return 201 with the record

2. `GET /api/v1/vehicles/:vin/history`
   - Just reads: all service_records for the VIN + the cached verdict/explanation from `vehicles`
   - No Gemini call here — verdict is already cached from step 1
   - If no records: return `{ verdict: null, explanation: null, repairs: [] }` (frontend treats as "no history found")

## Endpoints (optional / future — not required for the hackathon build, stub or skip)

- `GET /api/v1/vehicles/:id` — vehicle summary
- `GET /api/v1/vehicles/:id/mileage` — time-series mileage data
- `GET /api/v1/vehicles/:id/damage` — damage records + image URLs
- `GET /api/v1/user/:id/portfolio` — user dashboard (buyer/service-specific)
- `POST /api/v1/uploads/presign` — local upload helper for demo
- `GET /api/v1/mock/vehicle/:vin` — mock data endpoint for frontend dev
- `POST /api/v1/auth/login`, `/register`, `/refresh` — not used in prototype mode; keep as placeholders only if auth is added later

## Auth & Roles

- Prototype mode: no authentication required, no JWT or role gates.
- Keep `userId` as a plain field in requests only where useful for demo data — do not enforce login.
- App should be demoable without a sign-in flow.
- Future production version: add JWT auth and roles (`buyer`, `service`, `admin`).

## Environment Variables & Secrets

- `DATABASE_URL` — local DB connection string (SQLite in dev)
- `STORAGE_PROVIDER` — `local` for prototype
- `UPLOAD_DIR` — local folder for uploaded files, e.g. `./uploads`
- `PUBLIC_BASE_URL` — local dev base URL for generated image URLs, e.g. `http://localhost:3000`
- `GEMINI_API_KEY` — required for verdict generation
- `PORT`
- `SENTRY_DSN` — optional, not needed for demo
- Do NOT commit `.env`; add it to `.gitignore`

## Media & Uploads

- Local filesystem only; no S3/MinIO.
- Save uploaded files to `/uploads`, return a local public URL such as `/uploads/<filename>`.
- Max file size: 5–10MB.
- Allowed types: `image/jpeg`, `image/png`.
- Sanitize filenames and validate content-type before saving.
- Return a stable `publicUrl`/path in the record; store the canonical local path in DB.

## Validation & Error Format

- One shared validator function, not per-route boilerplate.
- VIN: 17 characters, disallow `I`, `O`, `Q` (checksum optional).
- `odometer_km`: non-negative integer.
- Required fields for service record: vin, odometer_km, service_type, insurance_claim, before_photo, after_photo, invoice_photo.
- Errors: consistent JSON `{ "errorCode": "string", "message": "string", "details": {...} }`.
- HTTP codes: `400` (bad input), `404` (not found), `429` (rate limit), `500` (server). Skip `401`/`403` since there's no auth.

## Gemini API (token-lean)

- One function, called only on new-record insert, not on every buyer lookup.
- Send only the compact fields Gemini needs, no extra metadata: `[{date, type, odometer_km, insurance_claim}]` — omit notes/text unless you want it factored in (adds tokens).
- Short system instruction, strict JSON output only, no explanation of reasoning:
  `"You are a used-car risk classifier. Given a JSON list of repairs, reply with ONLY this JSON: {\"verdict\":\"safe\"|\"caution\",\"explanation\":\"<max 2 short sentences, plain language>\"}. Multiple body/engine repairs or insurance claims → caution. Routine maintenance only → safe."`
- Use a small/cheap model (e.g. `gemini-2.5-flash` or `gemini-2.0-flash-lite`) — this task doesn't need a large model.
- Set `responseMimeType: "application/json"` (and optionally a `responseSchema`) to enforce strict JSON output instead of relying on prompt-only compliance.
- Set a low `maxOutputTokens` (~150) since output is just a small JSON object.
- On parse failure: keep the previous cached verdict, log the error, don't retry automatically.

## Realtime & Sync

- Not needed for the demo — skip WebSocket/SSE entirely.
- If added later: push `service_record.created` / `damage.confirmed` events, or fall back to short-polling.

## Out of scope for this build

- Market data/valuation provider for `estimatedValue`
- Email/SMS notifications
- Sentry/Datadog monitoring or tracing
- Webhooks for external integrations

## Minimal extras

- `.env`: `GEMINI_API_KEY`, `PORT`
- CORS open to the frontend origin
- No auth, no logging framework, no migrations tool — just a `schema.sql` run once on startup if tables don't exist

## Open decisions (flag, don't block on)

- Upload flow: backend multipart upload vs. local static-file serving — pick multipart since photos come from the Service Center form.
- Gemini call: synchronous direct call vs. async job/queue — sync is fine for demo scale.
- Rate limit thresholds for demo traffic — none needed.
- Image retention / PII policy — not needed for hackathon scope.
