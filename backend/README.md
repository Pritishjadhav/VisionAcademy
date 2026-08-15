# Vision Academy bundled OMR engine

OpenCV processor and printable-sheet generator used directly by Vision
Academy's Next.js route handlers.

No HTTP service or separate port is required. From the VisionAcademy root:

```powershell
npm run dev
```

The npm `predev` and `prestart` hooks create `backend/.venv` and install
`requirements.txt` when its contents change.

Grading accepts PDF (first page), JPEG, PNG, WebP, TIFF, and BMP scans.
Generated sheets use the registration-mark, candidate-details, and compact
multi-column OMR layout, with up to 180 questions on one A4 page.

## Test

```powershell
.\.venv\Scripts\pip install -r requirements-dev.txt
.\.venv\Scripts\pytest
```
