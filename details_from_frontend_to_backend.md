# Backend Spec — Power Shuttle (combined)

This single-file reference consolidates API endpoints, schemas, auth, env, uploads, integrations (Gemini), realtime, validation, sample payloads, and open questions for the backend implementation.

## Endpoints

Version: `/api/v1/...` recommended.

- `GET /api/v1/vehicles/:vin/history` — full vehicle history (VIN path param)
- `GET /api/v1/vehicles/:id` — vehicle summary
- `GET /api/v1/vehicles/:id/mileage` — time-series mileage data
- `GET /api/v1/vehicles/:id/damage` — damage records + image URLs
- `POST /api/v1/service` — submit a service record
- `POST /api/v1/auth/login` — not used in prototype mode; kept only if auth is added later
- `POST /api/v1/auth/register` — not used in prototype mode; kept only if auth is added later
- `POST /api/v1/auth/refresh` — not used in prototype mode; kept only if auth is added later
- `GET /api/v1/user/:id/portfolio` — user dashboard (buyer/service-specific)
- `POST /api/v1/uploads/presign` — local upload helper for demo
- `GET /api/v1/mock/vehicle/:vin` — mock data endpoint for frontend dev

## Schemas (minimum fields)

### Vehicle History (response)

```
{
  "vin": "string",
  "make": "string",
  "model": "string",
  "year": 2020,
  "estimatedValue": 12345.67,
  "mileageRecords": [{ "date": "iso", "mileage": 120000, "source": "string" }],
  "serviceRecords": [{ "id": "string", "date": "iso", "description": "string", "mileage": 120000, "provider": "string", "photos": ["url"] }],
  "damageRecords": [{ "date": "iso", "severity": "minor|major", "description": "string", "photos": ["url"] }],
  "photos": ["url"],
  "lastSeen": "iso"
}
```

### Service POST (request)

```
{
  "vin" or "vehicleId": "string",
  "userId": "string",
  "date": "iso",
  "mileage": 120000,
  "description": "string",
  "cost": 123.45,
  "photos": ["url"]
}
```

### Auth (not used in prototype mode)

```
No auth flow for the hackathon prototype.
```

### Upload presign response

```
{ "urls": [ { "fileName": "string", "presignedUrl": "string", "publicUrl": "string" } ] }
```

## Auth & Roles

- Prototype mode: no authentication required.
- Do not add JWT or role gates for the hackathon version.
- Keep `userId` as a plain field in requests when needed for demo data, but do not enforce login.
- The app should be easy to demo without a sign-in flow.
- If a future production version is needed, add JWT auth and roles later (`buyer`, `service`, `admin`).

## Environment Variables & Secrets

- `DATABASE_URL` — local DB connection string (SQLite/Postgres in dev)
- `STORAGE_PROVIDER` — `local` for prototype
- `UPLOAD_DIR` — local folder to store uploaded files, e.g. `./uploads`
- `PUBLIC_BASE_URL` — local dev base URL for generated image URLs, e.g. `http://localhost:3000`
- `GEMINI_API_KEY` or `AI_HISTORY_API_KEY` — optional only if a free/available AI service is used; not required for demo
- `SENTRY_DSN` — optional

Remember: do NOT commit `.env`; add it to `.gitignore`.

## Media & Uploads

- Prototype storage is local filesystem only; no S3/MinIO for hackathon.
- Backend saves uploaded files to a local folder and returns a local public URL such as `/uploads/<filename>`.
- Alternative: keep file URLs in a local mock dataset for demo.
- Max file size: 5–10MB recommended.
- Allowed types: `image/jpeg`, `image/png`, (optional `video/*`).
- Return stable `publicUrl` in API records; store canonical local URL in DB.
- Sanitize filenames and validate content-type.

## Integrations — Gemini & others

- AI/LLM: optional only; use a free-tier or mocked flow for demo, not a required paid service.
- If Gemini is used, call it with `GEMINI_API_KEY` only when available; otherwise use local mock data.
- Market data: optional price/valuation provider to compute `estimatedValue`.
- Email/SMS: optional for notifications (service record created).
- Sentry/Datadog: optional monitoring/tracing.

## Realtime & Sync

- Use WebSocket or Server-Sent Events to push events: `service_record.created`, `damage.confirmed`.
- If realtime not needed for demo, provide short-polling endpoints.
- Support webhooks for external integrations.

## Validation & Error Format

- VIN: 17 characters, disallow `I`, `O`, `Q`; basic checksum optional.
- Mileage: non-negative integer.
- Required fields: VIN or `vehicleId`, `userId`, `date`, `description` for service records.
- Errors: consistent JSON `{ "errorCode": "string", "message": "string", "details": {...} }`.
- Use HTTP codes: `400` (bad input), `401` (unauth), `403` (forbidden), `404` (not found), `429` (rate limit), `500` (server).

## Sample Payloads

### Vehicle history (GET /vehicles/:vin/history) — success

```
GET /api/v1/vehicles/1HGCM82633A004352/history

200 OK
{
  "vin": "1HGCM82633A004352",
  "make": "Honda",
  "model": "Accord",
  "year": 2012,
  "estimatedValue": 4500,
  "mileageRecords": [{ "date": "2026-08-01T00:00:00Z", "mileage": 120000, "source": "service" }],
  "serviceRecords": [{ "id": "r1", "date": "2026-07-01", "description": "oil change", "mileage": 119500, "photos": ["https://.../1.jpg"] }]
}
```

### Service POST (request)

```
POST /api/v1/service
{
  "vin": "1HGCM82633A004352",
  "userId": "u1",
  "date": "2026-09-01T10:00:00Z",
  "mileage": 120200,
  "description": "Replaced brake pads",
  "photos": ["http://localhost:3000/uploads/a1.jpg"]
}

201 Created
{ "success": true, "recordId": "r2" }
```

## Open Questions / Decisions

- Upload flow: backend multipart upload vs local static-file serving?
- Gemini call: synchronous direct call vs async job/queue for longer aggregation?
- Storage: local filesystem only for hackathon demo.
- Rate limits: what thresholds for demo traffic?
- Privacy: image retention policy and PII handling.

---

File references: this combined doc replaces individual docs under `docs/backend/` but those files remain for targeted edits.
