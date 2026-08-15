import { authorizeOmrRequest } from "@/lib/server/omr-auth";
import { adminDb } from "@/lib/firebase/admin";
import { OmrEngineError, runOmrEngine } from "@/lib/server/omr-engine";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ testId: string }> },
): Promise<Response> {
  const authorization = await authorizeOmrRequest(request, "report");
  if (authorization instanceof Response) return authorization;
  const { testId } = await context.params;
  const [testSnapshot, resultsSnapshot] = await Promise.all([
    adminDb.collection("omrTests").doc(testId).get(),
    adminDb.collection("omrResults").where("testId", "==", testId).get(),
  ]);
  if (!testSnapshot.exists) {
    return Response.json({ success: false, error: "OMR test not found." }, { status: 404 });
  }
  const test: Record<string, unknown> = { id: testSnapshot.id, ...testSnapshot.data() };
  if (
    test.examType === "JEE"
    && typeof test.marksPerCorrectAnswer === "number"
  ) {
    test.maxMarks = 75 * test.marksPerCorrectAnswer;
  }
  const results = resultsSnapshot.docs
    .map((document) => document.data())
    .sort((a, b) => Number(b.marksObtained) - Number(a.marksObtained));

  try {
    const report = await runOmrEngine<{ pdf_base64: string }>({
      operation: "report",
      test,
      results,
    });
    return new Response(Buffer.from(report.pdf_base64, "base64"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="omr-test-results.pdf"',
      },
    });
  } catch (error) {
    const engineError = error instanceof OmrEngineError ? error : null;
    return Response.json(
      { success: false, error: engineError?.message || "Could not generate the result sheet." },
      { status: engineError?.statusCode || 500 },
    );
  }
}
