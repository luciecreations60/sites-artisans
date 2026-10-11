/**
 * Miroir de public.claim_commercial_rate_limit (SQL).
 * Insert compteur à 0 puis +1 à chaque acceptation — limite N ⇒ N ok, N+1 refusé.
 */
export type RateLimitState = {
  hitCount: number;
  windowStartedAtMs: number;
};

export function claimCommercialRateLimit(
  state: RateLimitState | null,
  nowMs: number,
  limit: number,
  windowMs: number,
): { allowed: boolean; next: RateLimitState } {
  if (limit < 1 || windowMs < 60_000) {
    return {
      allowed: false,
      next: state ?? { hitCount: 0, windowStartedAtMs: nowMs },
    };
  }

  if (!state || nowMs - state.windowStartedAtMs >= windowMs) {
    return { allowed: true, next: { hitCount: 1, windowStartedAtMs: nowMs } };
  }

  if (state.hitCount >= limit) {
    return { allowed: false, next: state };
  }

  return {
    allowed: true,
    next: { hitCount: state.hitCount + 1, windowStartedAtMs: state.windowStartedAtMs },
  };
}
