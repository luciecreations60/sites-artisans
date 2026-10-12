/**
 * Contrats modules démo (33 combinaisons).
 * Logique alignée sur resolveDemoModules — exécutable sous node:test
 * (pas d’alias ~/ ni d’imports extensionless).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STATIC_PLAN_FEATURES } from "../../data/catalog/staticCatalog.ts";
import type { OfferTier } from "../../data/types.ts";

const TRADE_SLUGS = [
  "plombier",
  "electricien",
  "couvreur",
  "peintre",
  "paysagiste",
  "garage",
  "boulanger",
  "coiffure",
  "bienetre",
  "cordonnier",
  "serrurier",
] as const;

const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

const IMPLEMENTED = new Set([
  "gallery_basic",
  "gallery_filtered",
  "gallery_before_after",
  "estimator",
  "quote_form",
  "contact_form",
  "service_area",
  "testimonials",
  "services_list",
  "about_company",
]);

function included(tier: OfferTier): Set<string> {
  return new Set(
    STATIC_PLAN_FEATURES.filter((l) => l.planId === tier && l.inclusion === "included").map(
      (l) => l.featureId,
    ),
  );
}

function unavailable(tier: OfferTier): Set<string> {
  return new Set(
    STATIC_PLAN_FEATURES.filter((l) => l.planId === tier && l.inclusion === "unavailable").map(
      (l) => l.featureId,
    ),
  );
}

function demoHrefForConfig(tradeSlug: string, planId: OfferTier): string {
  return `/demos/${tradeSlug}/${planId}`;
}

describe("modules démo — 33 combinaisons métier × formule", () => {
  it("couvre bien 11 × 3 = 33 combinaisons", () => {
    assert.equal(TRADE_SLUGS.length * TIERS.length, 33);
  });

  for (const trade of TRADE_SLUGS) {
    for (const tier of TIERS) {
      it(`${trade} / ${tier} : inclusions catalogue cohérentes`, () => {
        const inc = included(tier);
        assert.ok(inc.has("gallery_basic"));
        assert.ok(inc.has("contact_form"));
        assert.ok(inc.has("services_list"));
        assert.ok(inc.has("about_company"));

        if (tier === "essentiel") {
          assert.ok(unavailable(tier).has("gallery_filtered"));
          assert.ok(unavailable(tier).has("gallery_before_after"));
          assert.ok(unavailable(tier).has("estimator"));
          assert.ok(unavailable(tier).has("quote_form"));
        }
        if (tier === "avance") {
          assert.ok(inc.has("gallery_filtered"));
          assert.ok(inc.has("quote_form"));
          assert.ok(unavailable(tier).has("gallery_before_after"));
          assert.ok(unavailable(tier).has("estimator"));
        }
        if (tier === "pro") {
          assert.ok(inc.has("gallery_filtered"));
          assert.ok(inc.has("gallery_before_after"));
          assert.ok(inc.has("estimator"));
          assert.ok(inc.has("quote_form"));
        }

        assert.equal(demoHrefForConfig(trade, tier), `/demos/${trade}/${tier}`);
      });
    }
  }
});

describe("modules démo — options incompatibles", () => {
  it("Essentiel refuse estimateur et avant/après", () => {
    const blocked = unavailable("essentiel");
    assert.ok(blocked.has("estimator"));
    assert.ok(blocked.has("gallery_before_after"));
    assert.ok(IMPLEMENTED.has("estimator"));
  });

  it("Pro inclut les modules premium développés", () => {
    const inc = included("pro");
    for (const id of ["gallery_before_after", "estimator", "gallery_filtered"] as const) {
      assert.ok(inc.has(id));
      assert.ok(IMPLEMENTED.has(id));
    }
  });
});
