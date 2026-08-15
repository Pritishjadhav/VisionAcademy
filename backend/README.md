# Vision Academy OMR backend

FastAPI service used by the Vision Academy admin OMR workflow.

## Run locally

```powershell
py -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000
```

Configuration:

- `OMR_ALLOWED_ORIGINS`, comma-separated origins, defaults to `http://localhost:3000`
- `OMR_MAX_UPLOAD_BYTES`, defaults to 10 MB
- `OMR_GRADE_LIMIT`, requests per minute per IP, defaults to 20
- `OMR_GENERATE_LIMIT`, requests per minute per IP, defaults to 10
- `OMR_INTERNAL_API_KEY`, optional shared secret required by grading and generation endpoints

For the selected single-server deployment, bind this service to `127.0.0.1`.
Set the same `OMR_INTERNAL_API_KEY` for the Next.js process and this service.

## Test

```powershell
.\.venv\Scripts\pytest
```
