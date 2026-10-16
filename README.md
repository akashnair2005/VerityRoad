# VerityRoad — Evidence Before Assertion

Helping citizens prepare more reliable road-damage and garbage reports by comparing written claims with what submitted photographs can actually show.

---

## Overview

VerityRoad is a focused civic-tech tool:

1. Choose **pothole / road damage** or **garbage / waste accumulation**.
2. Upload one or two photographs and write a description plus specific claims.
3. The server sends the images and text to hosted **Gemma 4** (`gemma-4-26b-a4b-it`) using the official `@google/genai` SDK.
4. You review visible observations, claim-by-claim statuses, evidence gaps, and a cautious complaint draft.
5. You may add another photo and reassess. Copy or reset the draft. **Verify it before sending it to any authority.** This app does not file reports.

Images are held in memory for a single analysis request and are not written to disk.

---

## Local setup

1. Install **Node.js 20+**.
2. Copy environment config:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell: `Copy-Item .env.example .env`

3. Get an API key from [Google AI Studio](https://aistudio.google.com/apikey) and set it in `.env`:

   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```

4. Install and run:

   ```bash
   npm install
   npm start
   ```

5. Open `http://localhost:3000`.

`.gitignore` excludes `.env` and `node_modules/`. Do not put the API key in frontend files.

### Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for analysis | Google AI Studio key (server-side only). `GOOGLE_API_KEY` is accepted as an alias. |
| `GEMINI_MODEL` | No | Defaults to `gemma-4-26b-a4b-it`. |
| `PORT` | No | Defaults to `3000`. |
| `CORS_ORIGIN` | Recommended in production | Exact browser origin, e.g. `https://your-domain`. |
| `ANALYZE_TIMEOUT_MS` | No | Defaults to `90000`. |

---

## Architecture

- **Frontend:** static pages in `public/` (Stitch design tokens: Newsreader + Inter, forest/ivory civic palette).
- **Backend:** `src/server.mjs` Node HTTP server. Serves the UI and `POST /api/analyze`.
- **Model:** `src/gemma.mjs` calls `@google/genai` `models.generateContent` with image inline data and JSON schema validation in `src/schema.mjs`.
- **No permanent image store.** No auth, maps, payments, or authority integrations in V1.

### API

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Liveness. |
| `GET` | `/api/ready` | `{ configured, model, imageRetention }` — never returns the key. |
| `POST` | `/api/analyze` | JSON body: `issueType` (`road_damage` \| `garbage`), `description`, `claims` (array or newline string), `images` (`[{ mimeType, data: base64 }]`). Max 2 images, 6 MB each, JPEG/PNG/WEBP with magic-byte checks. |

Finding statuses: `supported_by_visible_evidence`, `consistent_but_not_measurable`, `not_visible_in_image`, `appears_inconsistent_with_image`, `requires_external_evidence`, `insufficient_information`.

Absence from a photo is **not** treated as proof that a claim is false. Depth, ownership, cause, accident history, legal responsibility, and exact location are not established by a single image.

---

## Tests

```bash
npm test              # schema, request validation, mocked HTTP API
npm run build         # syntax check of server and client entrypoints
npm run test:text     # live Gemma text classification (needs API key)
npm run test:image -- path/to/road-or-garbage.jpg
npm run test:live     # live multimodal call if GEMINI_API_KEY is set
```

`npm test` uses **mocks** for `/api/analyze` success paths. Those results are not proof of live Gemma access. Use `test:live` or `test:image` with a real road-damage or garbage photo for that.

Existing helpers in `test-gemma.mjs` and `test-validation.mjs` remain for the original six-field evidence object used by the CLI suite.

---

## Known limitations

- Hosted Gemma can refuse structured JSON, time out, or misread a photo. The UI exposes retry and edit paths.
- A generated JPEG used in automated live checks is a connectivity test, not a substitute for a real field photograph.
- Rate limiting is in-memory per process (not shared across multiple server instances).
- Do not deploy with an open CORS origin and a billed API key on an untrusted network without additional controls.

---

## Deployment prerequisites (do not deploy from this task)

- Node.js 20+ runtime.
- `GEMINI_API_KEY` as a server secret (never a `VITE_` / public prefix).
- `CORS_ORIGIN` set to the public site origin.
- HTTPS in production.
- Request body size at least ~14 MB in any reverse proxy (`MAX_JSON_BODY_BYTES`).
- Timeout at the proxy ≥ analysis timeout (default 90s).
- Single dyno/process rate limiter unless you add a shared store.

Stitch source remains in `stitch_verityroad_evidence_platform/` as the visual reference. Dashboard-only Stitch chrome (maps, fake GPS, 311 export, accounts) is intentionally omitted from V1.
