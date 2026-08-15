# Vision Academy

Education management and examination platform built with Next.js, Firebase,
and a bundled OpenCV OMR engine.

## Architecture

- `src/app`: public, admin, student, parent, and faculty routes
- `src/actions`: authenticated Firebase Admin mutations
- `src/lib/firebase`: browser and server Firebase clients
- `src/app/api/omr`: authenticated, rate-limited OMR route handlers
- `backend`: bundled OpenCV grading and PDF generation engine

Admin requests pass through Next.js, where Firebase ID tokens are verified and
per-user limits are applied. The route handlers invoke the project-local Python
engine directly, so no separate HTTP service is exposed. The limiter is
intentionally in memory for a single-server deployment.

## Development

Start the complete application:

```powershell
npm install
npm run dev
```

The `predev` script creates a project-local Python environment and installs the
bundled OpenCV dependencies automatically on the first run. OMR grading and PDF
generation execute directly from the Next.js route handlers. There is no
separate OMR server or port to configure.

Required Next.js environment variables include the existing Firebase client and
Admin SDK values. OMR does not require additional environment variables.

## Validation

```powershell
npm run build
npx tsc --noEmit
cd backend
.\.venv\Scripts\pip install -r requirements-dev.txt
.\.venv\Scripts\pytest
```
