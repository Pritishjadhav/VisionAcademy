import { requireAdmin } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

const OMR_API_URL = process.env.OMR_API_URL || "http://127.0.0.1:8000";

export async function authorizeOmrRequest(
  request: Request,
  operation: "grade" | "generate",
): Promise<Response | { uid: string }> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  try {
    const user = await requireAdmin(token);
    const limit = operation === "grade" ? 12 : 8;
    const result = checkRateLimit(`omr:${operation}:${user.uid}`, limit);
    if (!result.allowed) {
      return Response.json(
        { success: false, error: `Too many requests. Try again in ${result.retryAfterSeconds} seconds.` },
        { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
      );
    }
    return { uid: user.uid };
  } catch {
    return Response.json({ success: false, error: "Administrator authentication required." }, { status: 401 });
  }
}

export function omrBackendUrl(path: string): string {
  return new URL(path, OMR_API_URL).toString();
}

export function omrBackendHeaders(): HeadersInit {
  const key = process.env.OMR_INTERNAL_API_KEY;
  return key ? { "X-Internal-API-Key": key } : {};
}
