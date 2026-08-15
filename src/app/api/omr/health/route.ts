import { OmrEngineError, runOmrEngine } from "@/lib/server/omr-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await runOmrEngine({ operation: "health" });
    return Response.json({ status: "ok", mode: "bundled" });
  } catch (error) {
    const engineError = error instanceof OmrEngineError ? error : null;
    return Response.json(
      {
        status: "unavailable",
        error: engineError?.message || "The bundled OMR engine is unavailable.",
      },
      { status: 503 },
    );
  }
}
