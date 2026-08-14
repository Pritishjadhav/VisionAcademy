import { authorizeOmrRequest, omrBackendHeaders, omrBackendUrl } from "@/lib/server/omr-proxy";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const authorization = await authorizeOmrRequest(request, "generate");
  if (authorization instanceof Response) return authorization;

  const incoming = new URL(request.url);
  const query = new URLSearchParams({
    questions: incoming.searchParams.get("questions") || "20",
    choices: incoming.searchParams.get("choices") || "4",
    title: incoming.searchParams.get("title") || "Vision Academy - OMR Sheet",
  });

  try {
    const response = await fetch(omrBackendUrl(`/generate-omr?${query}`), {
      headers: omrBackendHeaders(),
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        ...(response.ok
          ? { "Content-Disposition": 'attachment; filename="vision-academy-omr.pdf"' }
          : {}),
      },
    });
  } catch {
    return Response.json(
      { success: false, error: "The OMR service is unavailable. Start the backend and try again." },
      { status: 503 },
    );
  }
}
