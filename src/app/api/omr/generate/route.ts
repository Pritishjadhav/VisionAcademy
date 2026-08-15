import { authorizeOmrRequest } from "@/lib/server/omr-auth";
import { OmrEngineError, runOmrEngine } from "@/lib/server/omr-engine";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOmrRequest(request, "generate");
  if (authorization instanceof Response) return authorization;

  const incoming = new URL(request.url);
  const questions = Number(incoming.searchParams.get("questions") || "20");
  const choices = Number(incoming.searchParams.get("choices") || "4");
  const title = incoming.searchParams.get("title") || "Vision Academy - OMR Sheet";
  const examType = incoming.searchParams.get("examType") === "JEE" ? "JEE" : "NEET";

  try {
    const result = await runOmrEngine<{ pdf_base64: string }>({
      operation: "generate",
      questions,
      choices,
      title,
      exam_type: examType,
    });
    return new Response(Buffer.from(result.pdf_base64, "base64"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="vision-academy-omr.pdf"',
      },
    });
  } catch (error) {
    const engineError = error instanceof OmrEngineError ? error : null;
    return Response.json(
      {
        success: false,
        error: engineError?.message || "The OMR sheet could not be generated.",
        code: engineError?.code || "OMR_ENGINE_ERROR",
      },
      { status: engineError?.statusCode || 500 },
    );
  }
}
