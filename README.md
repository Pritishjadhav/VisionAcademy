# Vision Academy

Education management and examination platform built with Next.js, Firebase,
and a local FastAPI/OpenCV OMR service.

## Architecture

- `src/app`: public, admin, student, parent, and faculty routes
- `src/actions`: authenticated Firebase Admin mutations
- `src/lib/firebase`: browser and server Firebase clients
- `src/app/api/omr`: authenticated, rate-limited OMR proxy routes
- `backend`: modular FastAPI OMR grading and PDF generation service

The browser never calls the Python service directly. Admin requests pass through
Next.js, where Firebase ID tokens are verified and per-user limits are applied.
The Python service has an additional per-IP limiter and optional shared secret.
The limiters are intentionally in memory for a single-server deployment.

## Development

Start the OMR backend:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, start Next.js:

```powershell
npm install
npm run dev
```

Required Next.js environment variables include the existing Firebase client and
Admin SDK values. OMR-specific values:

```text
OMR_API_URL=http://127.0.0.1:8000
OMR_INTERNAL_API_KEY=<shared-random-secret>
```

Set the backend's `OMR_INTERNAL_API_KEY` to the same value.

## Validation

```powershell
npm run build
npx tsc --noEmit
cd backend
.\.venv\Scripts\pytest
```
