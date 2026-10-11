import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { claimCommercialRateLimit } from "./rateLimit.ts";

describe("claimCommercialRateLimit", () => {
  const windowMs = 3_600_000;
  const t0 = 1_000_000;

  it("accepte les 8 premiers appels et refuse le 9ᵉ", () => {
    let state = null as ReturnType<typeof claimCommercialRateLimit>["next"] | null;
    for (let i = 1; i <= 8; i++) {
      const res = claimCommercialRateLimit(state, t0 + i, 8, windowMs);
      assert.equal(res.allowed, true, `appel ${i} doit être accepté`);
      assert.equal(res.next.hitCount, i);
      state = res.next;
    }
    const ninth = claimCommercialRateLimit(state, t0 + 9, 8, windowMs);
    assert.equal(ninth.allowed, false);
    assert.equal(ninth.next.hitCount, 8);
  });

  it("le premier appel ne compte qu’une fois (hitCount = 1)", () => {
    const first = claimCommercialRateLimit(null, t0, 8, windowMs);
    assert.equal(first.allowed, true);
    assert.equal(first.next.hitCount, 1);
  });

  it("réinitialise la fenêtre après expiration", () => {
    const saturated = { hitCount: 8, windowStartedAtMs: t0 };
    const after = claimCommercialRateLimit(saturated, t0 + windowMs, 8, windowMs);
    assert.equal(after.allowed, true);
    assert.equal(after.next.hitCount, 1);
  });
});
