type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > cutoff);

  if (bucket.timestamps.length >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.timestamps[0] + windowMs - now) / 1000),
    );
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, remaining: limit - bucket.timestamps.length };
}

export function enforceRateLimit(key: string, limit: number, windowMs = 60_000): void {
  const result = checkRateLimit(key, limit, windowMs);
  if (!result.allowed) {
    throw new Error(`Too many requests. Try again in ${result.retryAfterSeconds} seconds.`);
  }
}
