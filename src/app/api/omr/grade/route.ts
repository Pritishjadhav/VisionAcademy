import { authorizeOmrRequest } from "@/lib/server/omr-auth";
import { OmrEngineError, runOmrEngine } from "@/lib/server/omr-engine";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOmrRequest(request, "grade");
  if (authorization instanceof Response) return authorization;

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 11 * 1024 * 1024) {
    return Response.json({ success: false, error: "Upload is too large." }, { status: 413 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ success: false, error: "An OMR image is required." }, { status: 422 });
    }
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/tiff",
      "image/bmp",
    ];
    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".bmp"];
    const lowerName = file.name.toLowerCase();
    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.some((extension) => lowerName.endsWith(extension))
    ) {
      return Response.json(
        { success: false, error: "Upload a PDF, JPEG, PNG, WebP, TIFF, or BMP file." },
        { status: 415 },
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ success: false, error: "Upload is too large." }, { status: 413 });
    }

    const data = await runOmrEngine({
      operation: "grade",
      questions: Number(form.get("num_questions")),
      choices: Number(form.get("num_choices")),
      answer_key: String(form.get("answer_key") || ""),
      image_base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      media_type: file.type,
    });
    return Response.json({ success: true, data });
  } catch (error) {
    const engineError = error instanceof OmrEngineError ? error : null;
    return Response.json(
      {
        success: false,
        error: engineError?.message || "The OMR image could not be graded.",
        code: engineError?.code || "OMR_ENGINE_ERROR",
      },
      { status: engineError?.statusCode || 500 },
    );
  }
}
