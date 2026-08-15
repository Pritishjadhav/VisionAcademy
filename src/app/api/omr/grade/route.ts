import { authorizeOmrRequest, omrBackendHeaders, omrBackendUrl } from "@/lib/server/omr-proxy";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeOmrRequest(request, "grade");
  if (authorization instanceof Response) return authorization;

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 11 * 1024 * 1024) {
    return Response.json({ success: false, error: "Upload is too large." }, { status: 413 });
  }

  try {
    const response = await fetch(omrBackendUrl("/grade"), {
      method: "POST",
      headers: omrBackendHeaders(),
      body: await request.formData(),
      cache: "no-store",
    });
    return new Response(response.body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") || "application/json" },
    });
  } catch {
    return Response.json(
      { success: false, error: "The OMR service is unavailable. Start the backend and try again." },
      { status: 503 },
    );
  }
}
