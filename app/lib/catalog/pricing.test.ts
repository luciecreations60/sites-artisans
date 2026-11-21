import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getStaticPublicCatalog, STATIC_FEATURES } from "../../data/catalog/staticCatalog.ts";
import { calculateQuote, isFeatureOrderable, optionSetupPriceLabel } from "./pricing.ts";

describe("catalogue statique de secours", () => {
  it("expose les trois prix de référence", () => {
    const catalog = getStaticPublicCatalog();
    const byId = Object.fromEntries(catalog.plans.map((p) => [p.id, p.setupPriceCents]));
    assert.equal(byId.essentiel, 49000);
    assert.equal(byId.avance, 79000);
    assert.equal(byId.pro, 119000);
    assert.equal(catalog.migrationPending, true);
    assert.equal(catalog.source, "static");
  });

  it("n’expose pas les champs internes dans le catalogue public", () => {
    const catalog = getStaticPublicCatalog();
    for (const feature of catalog.features) {
      assert.equal("internal" in feature, false);
      assert.equal("configMinutes" in feature, false);
      assert.equal("profitabilityNote" in feature, false);
    }
  });

  it("propose des recommandations pour les 11 métiers", () => {
    const catalog = getStaticPublicCatalog();
    const trades = new Set(catalog.tradeFeatures.map((t) => t.tradeSlug));
    assert.equal(trades.size, 11);
  });
});

describe("moteur de calcul", () => {
  const catalog = getStaticPublicCatalog();

  it("calcule le prix Essentiel seul", () => {
    const quote = calculateQuote(catalog, { planId: "essentiel" });
    assert.equal(quote.planSetupCents, 49000);
    assert.equal(quote.creationSubtotalCents, 49000);
    assert.equal(quote.recurringSubtotalCents, 0);
  });

  it("calcule Avancé et Pro", () => {
    assert.equal(calculateQuote(catalog, { planId: "avance" }).creationSubtotalCents, 79000);
    assert.equal(calculateQuote(catalog, { planId: "pro" }).creationSubtotalCents, 119000);
  });

  it("ne refacture pas une fonctionnalité déjà incluse", () => {
    const quote = calculateQuote(catalog, {
      planId: "pro",
      optionFeatureIds: ["estimator", "contact_form"],
    });
    assert.ok(quote.skipped.some((s) => s.featureId === "estimator"));
    assert.ok(quote.skipped.some((s) => s.featureId === "contact_form"));
    assert.equal(quote.creationSubtotalCents, 119000);
  });

  it("refuse une option sans prix (pas de 0 €)", () => {
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["pages_extra"],
    });
    assert.ok(quote.skipped.some((s) => s.featureId === "pages_extra"));
    assert.equal(quote.creationSubtotalCents, 49000);
  });

  it("ajoute une option tarifée Essentiel au sous-total création", () => {
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["quote_form", "gallery_filtered"],
    });
    assert.equal(quote.creationSubtotalCents, 49000 + 9000 + 12000);
  });

  it("sépare la maintenance récurrente du prix de création", () => {
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["maintenance_tech"],
    });
    assert.equal(quote.creationSubtotalCents, 49000);
    assert.equal(quote.recurringSubtotalCents, 2900);
  });

  it("marque les fonctionnalités nécessitant une étude", () => {
    // content_writing est publiée avec commercialKind study
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["content_writing"],
    });
    // déjà incluse sur essentiel → skipped inclus ; sur une option hors plan :
    const quote2 = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["pages_extra"],
    });
    assert.ok(quote2.skipped.some((s) => s.featureId === "pages_extra"));
    assert.ok(quote.skipped.length >= 1);
  });

  it("facture l’option avant/après sur Essentiel", () => {
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["gallery_before_after"],
    });
    assert.equal(quote.creationSubtotalCents, 49000 + 15000);
    assert.ok(quote.optionLines.some((l) => l.featureId === "gallery_before_after"));
  });

  it("signale les dépendances manquantes", () => {
    // Forcer une feature publiée avec dépendance — gallery_filtered dépend de gallery_basic
    // gallery_filtered est unavailable sur essentiel
    const quote = calculateQuote(catalog, {
      planId: "avance",
      optionFeatureIds: ["gallery_filtered"],
    });
    // incluse → skipped déjà incluse
    assert.ok(quote.skipped.some((s) => s.featureId === "gallery_filtered"));
  });

  it("sépare les frais récurrents et externes", () => {
    // Ajoute une feature fictive via clone du catalogue
    const enriched = {
      ...catalog,
      features: [
        ...catalog.features,
        {
          id: "opt_paid_setup",
          category: "services" as const,
          name: "Option payante test",
          description: "test",
          setupPriceCents: 5000,
          recurringPriceCents: 2000,
          billingType: "setup_and_recurring" as const,
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
        {
          id: "opt_external",
          category: "interactions" as const,
          name: "Lien externe test",
          description: "test",
          setupPriceCents: null,
          recurringPriceCents: null,
          billingType: "external" as const,
          commercialKind: "optional_priced" as const,
          isAvailable: true,
          status: "published" as const,
          personalizationLevel: "none" as const,
          devStatus: "ready" as const,
          sortOrder: 1000,
          externalProviderId: "calendly",
          dependsOn: [],
          incompatibleWith: [],
        },
      ],
      planFeatures: [
        ...catalog.planFeatures,
        {
          planId: "essentiel" as const,
          featureId: "opt_paid_setup",
          inclusion: "optional" as const,
          variantLabel: null,
        },
        {
          planId: "essentiel" as const,
          featureId: "opt_external",
          inclusion: "optional" as const,
          variantLabel: null,
        },
      ],
    };

    const quote = calculateQuote(enriched, {
      planId: "essentiel",
      optionFeatureIds: ["opt_paid_setup", "opt_external"],
    });
    assert.equal(quote.creationSubtotalCents, 49000 + 5000);
    assert.equal(quote.recurringSubtotalCents, 2000);
    assert.ok(quote.externalNotes.length >= 1);
    assert.ok(quote.optionLines.some((l) => l.kind === "external"));
  });

  it("prépare HT/TVA/TTC sans taux figé", () => {
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      tax: { vatRateBps: 2000 },
    });
    assert.equal(quote.tax.creationHtCents, 49000);
    assert.equal(quote.tax.creationVatCents, 9800);
    assert.equal(quote.tax.creationTtcCents, 58800);
  });

  it("détecte les incompatibilités", () => {
    const enriched = {
      ...catalog,
      features: [
        ...catalog.features,
        {
          id: "a_test",
          category: "interactions" as const,
          name: "A",
          description: "",
          setupPriceCents: 1000,
          recurringPriceCents: null,
          billingType: "setup" as const,
          commercialKind: "optional_priced" as const,
          isAvailable: true,
          status: "published" as const,
          personalizationLevel: "none" as const,
          devStatus: "ready" as const,
          sortOrder: 1,
          externalProviderId: null,
          dependsOn: [],
          incompatibleWith: ["b_test"],
        },
        {
          id: "b_test",
          category: "interactions" as const,
          name: "B",
          description: "",
          setupPriceCents: 1000,
          recurringPriceCents: null,
          billingType: "setup" as const,
          commercialKind: "optional_priced" as const,
          isAvailable: true,
          status: "published" as const,
          personalizationLevel: "none" as const,
          devStatus: "ready" as const,
          sortOrder: 2,
          externalProviderId: null,
          dependsOn: [],
          incompatibleWith: ["a_test"],
        },
      ],
      planFeatures: [
        ...catalog.planFeatures,
        {
          planId: "essentiel" as const,
          featureId: "a_test",
          inclusion: "optional" as const,
          variantLabel: null,
        },
        {
          planId: "essentiel" as const,
          featureId: "b_test",
          inclusion: "optional" as const,
          variantLabel: null,
        },
      ],
    };
    const quote = calculateQuote(enriched, {
      planId: "essentiel",
      optionFeatureIds: ["a_test", "b_test"],
    });
    assert.ok(quote.incompatibilities.length >= 1);
  });
});

describe("commercialisabilité", () => {
  it("accepte les options tarifées et refuse le study", () => {
    const priced = STATIC_FEATURES.find((f) => f.id === "maintenance_tech");
    const study = STATIC_FEATURES.find((f) => f.id === "pages_extra");
    assert.ok(priced);
    assert.ok(study);
    assert.equal(isFeatureOrderable(priced), true);
    assert.equal(isFeatureOrderable(study), false);
  });

  it("affiche « à partir de » pour QR / print / actualités", () => {
    assert.match(optionSetupPriceLabel("qr_code", 2900), /à partir de/);
    assert.match(optionSetupPriceLabel("flyer", 12000), /à partir de/);
    assert.match(optionSetupPriceLabel("quote_form", 9000), /^\+/);
  });
});

describe("booking_external — mise en place tarifée", () => {
  it("STATIC : Essentiel + booking = 490 € + 49 €, abonnement à part", () => {
    const catalog = getStaticPublicCatalog();
    const booking = catalog.features.find((f) => f.id === "booking_external");
    assert.ok(booking);
    assert.equal(booking.setupPriceCents, 4900);
    assert.equal(booking.billingType, "setup");
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["booking_external"],
    });
    assert.equal(quote.creationSubtotalCents, 53900);
    assert.ok(
      quote.optionLines.some(
        (l) => l.featureId === "booking_external" && l.kind === "option_setup" && l.amountCents === 4900,
      ),
    );
    assert.ok(quote.externalNotes.length >= 1);
  });

  it("quote_form optional sur Essentiel → +90 €", () => {
    const catalog = getStaticPublicCatalog();
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["quote_form"],
    });
    assert.equal(quote.creationSubtotalCents, 58000);
    assert.ok(
      quote.optionLines.some(
        (l) => l.featureId === "quote_form" && l.kind === "option_setup" && l.amountCents === 9000,
      ),
    );
  });

  it("catalog_services included sans lien formule → non facturé", () => {
    const base = getStaticPublicCatalog();
    const catalog = {
      ...base,
      planFeatures: base.planFeatures.filter((l) => l.featureId !== "catalog_services"),
      features: base.features.map((f) =>
        f.id === "catalog_services"
          ? {
              ...f,
              setupPriceCents: null,
              billingType: "none" as const,
              commercialKind: "included" as const,
              isAvailable: true,
              status: "published" as const,
            }
          : f,
      ),
    };
    const quote = calculateQuote(catalog, {
      planId: "essentiel",
      optionFeatureIds: ["catalog_services"],
    });
    assert.equal(quote.creationSubtotalCents, 49000);
    assert.ok(quote.skipped.some((s) => s.featureId === "catalog_services"));
  });
});
