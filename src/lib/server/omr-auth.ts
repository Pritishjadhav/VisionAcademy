import { requireAdmin } from "@/lib/server/auth";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function authorizeOmrRequest(
  request: Request,
  operation: "grade" | "generate",
): Promise<Response | { uid: string }> {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  try {
    const user = await requireAdmin(token);
    const limit = operation === "grade" ? 12 : 30;
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
