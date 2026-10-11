/**
 * Tests scénarios configurateur.
 * `recommend.ts` utilise les alias `~/` (Vite/tsc) : on rejoue la logique de
 * comparaison ici via `calculateQuote` pour rester exécutable sous node:test.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog } from "../../data/catalog/staticCatalog.ts";
import { calculateQuote } from "../catalog/pricing.ts";
import type { OfferTier } from "../../data/types.ts";
import type { PublicCatalog } from "../../data/catalog/types.ts";

const catalog = getStaticPublicCatalog();

function scenarioComplete(
  cat: PublicCatalog,
  planId: OfferTier,
  desired: string[],
): { complete: boolean; total: number; unavailable: number; study: number } {
  const links = cat.planFeatures.filter((l) => l.planId === planId);
  const included = new Set(links.filter((l) => l.inclusion === "included").map((l) => l.featureId));
  const unavailable = new Set(
    links.filter((l) => l.inclusion === "unavailable").map((l) => l.featureId),
  );
  const byId = new Map(cat.features.map((f) => [f.id, f]));
  let study = 0;
  let unavail = 0;
  const extras: string[] = [];
  for (const id of desired) {
    if (included.has(id)) continue;
    if (unavailable.has(id)) {
      unavail += 1;
      continue;
    }
    const f = byId.get(id);
    if (!f || f.commercialKind === "study" || f.setupPriceCents == null) {
      if (f?.billingType === "external") continue;
      study += 1;
      continue;
    }
    extras.push(id);
  }
  const quote = calculateQuote(cat, { planId, optionFeatureIds: extras });
  return {
    complete: unavail === 0 && study === 0,
    total: quote.creationSubtotalCents,
    unavailable: unavail,
    study,
  };
}

describe("configurateur — scénarios tarifaires", () => {
  it("S1: plombier Essentiel sans option = prix formule seule", () => {
    const quote = calculateQuote(catalog, { planId: "essentiel", optionFeatureIds: [] });
    assert.equal(quote.creationSubtotalCents, 49000);
  });

  it("S2/S3: option payante fictive augmente puis revient", () => {
    const enriched = {
      ...catalog,
      features: [
        ...catalog.features,
        {
          id: "opt_plus",
          category: "services" as const,
          name: "Option +",
          description: "",
          setupPriceCents: 10000,
          recurringPriceCents: null,
          billingType: "setup" as const,
          commercialKind: "optional_priced" as const,
          isAvailable: true,
          status: "published" as const,
          personalizationLevel: "none" as const,
          devStatus: "ready" as const,
          sortOrder: 999,
          externalProviderId: null,
          dependsOn: [],
          incompatibleWith: [],
        },
      ],
      planFeatures: [
        ...catalog.planFeatures,
        {
          planId: "essentiel" as const,
          featureId: "opt_plus",
          inclusion: "optional" as const,
          variantLabel: null,
        },
      ],
    };
    const withOpt = calculateQuote(enriched, {
      planId: "essentiel",
      optionFeatureIds: ["opt_plus"],
    });
    assert.equal(withOpt.creationSubtotalCents, 59000);
    const without = calculateQuote(enriched, { planId: "essentiel", optionFeatureIds: [] });
    assert.equal(without.creationSubtotalCents, 49000);
  });

  it("S4: option déjà incluse sans supplément", () => {
    const quote = calculateQuote(catalog, {
      planId: "pro",
      optionFeatureIds: ["estimator"],
    });
    assert.equal(quote.creationSubtotalCents, 119000);
    assert.ok(quote.skipped.some((s) => s.featureId === "estimator"));
  });

  it("S5: changement vers Avancé recalcule", () => {
    const a = calculateQuote(catalog, { planId: "essentiel" });
    const b = calculateQuote(catalog, { planId: "avance" });
    assert.equal(a.creationSubtotalCents, 49000);
    assert.equal(b.creationSubtotalCents, 79000);
  });

  it("S6: coiffure a des recommandations métier", () => {
    const recs = catalog.tradeFeatures.filter((t) => t.tradeSlug === "coiffure");
    assert.ok(recs.length >= 3);
    assert.ok(recs.some((r) => r.featureId === "booking_external"));
  });

  it("S7/S8: composer privilégie la formule complète la moins chère", () => {
    const desired = ["quote_form", "gallery_filtered"];
    const avance = scenarioComplete(catalog, "avance", desired);
    const pro = scenarioComplete(catalog, "pro", desired);
    const essentiel = scenarioComplete(catalog, "essentiel", desired);
    assert.equal(avance.complete, true);
    assert.equal(pro.complete, true);
    assert.ok(avance.total <= pro.total);
    // Essentiel : gallery_filtered / quote_form souvent unavailable → incomplet
    assert.ok(essentiel.complete === false || essentiel.total <= avance.total);
  });

  it("S8: économie réelle Pro → Avancé pour les mêmes besoins inclus", () => {
    const desired = ["quote_form", "gallery_filtered"];
    const avance = scenarioComplete(catalog, "avance", desired);
    const pro = scenarioComplete(catalog, "pro", desired);
    assert.ok(avance.complete && pro.complete);
    assert.ok(pro.total - avance.total > 0);
  });

  it("S9: option sans prix → total partiel", () => {
    const s = scenarioComplete(catalog, "essentiel", ["pages_extra"]);
    assert.equal(s.complete, false);
  });
});
