import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog } from "../../data/catalog/staticCatalog.ts";
import { calculateQuote, catalogAllowsContractualQuote } from "./pricing.ts";
import type { PublicCatalog } from "../../data/catalog/types.ts";

const base = getStaticPublicCatalog();

function withPricedOption(qtyFeatureId = "opt_qty_test"): PublicCatalog {
  return {
    ...base,
    features: [
      ...base.features,
      {
        id: qtyFeatureId,
        category: "services",
        name: "Option quantité test",
        description: "Test",
        setupPriceCents: 1000,
        recurringPriceCents: null,
        billingType: "setup",
        commercialKind: "optional_priced",
        isAvailable: true,
        status: "published",
        personalizationLevel: "none",
        devStatus: "ready",
        sortOrder: 999,
        externalProviderId: null,
        dependsOn: [],
        incompatibleWith: [],
      },
    ],
    planFeatures: [
      ...base.planFeatures.filter(
        (l) => !(l.planId === "essentiel" && l.featureId === qtyFeatureId),
      ),
      {
        planId: "essentiel",
        featureId: qtyFeatureId,
        inclusion: "optional",
        variantLabel: null,
      },
    ],
  };
}

describe("calculateQuote — quantités", () => {
  it("multiplie une option tarifée par la quantité", () => {
    const catalog = withPricedOption();
    const unit = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["opt_qty_test"],
      optionQuantities: { opt_qty_test: 1 },
    });
    const triple = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["opt_qty_test"],
      optionQuantities: { opt_qty_test: 3 },
    });
    assert.equal(unit.creationSubtotalCents, 49000 + 1000);
    assert.equal(triple.creationSubtotalCents, 49000 + 3000);
  });

  it("ignore une quantité négative (traite comme 1)", () => {
    const catalog = withPricedOption();
    const q = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["opt_qty_test"],
      optionQuantities: { opt_qty_test: -5 },
    });
    assert.equal(q.creationSubtotalCents, 49000 + 1000);
  });

  it("un prix navigateur falsifié n’existe pas dans le résultat serveur local", () => {
    const catalog = withPricedOption();
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["opt_qty_test"],
    });
    // Le client pourrait envoyer 1 € — le moteur ignore ce total
    const forgedClientTotal = 100;
    assert.notEqual(quote.creationSubtotalCents, forgedClientTotal);
    assert.equal(quote.creationSubtotalCents, 50000);
  });
});

describe("catalogue contractuel", () => {
  it("refuse le catalogue statique pour un devis contractuel", () => {
    assert.equal(catalogAllowsContractualQuote(base), false);
  });

  it("accepte un catalogue supabase prêt", () => {
    assert.equal(
      catalogAllowsContractualQuote({ ...base, source: "supabase", migrationPending: false }),
      true,
    );
  });
});
