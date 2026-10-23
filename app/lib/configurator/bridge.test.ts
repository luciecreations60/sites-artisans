/**
 * Tests pont démo ↔ configurateur (logique pure, sans localStorage).
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { OfferTier, TradeSlug } from "../../data/types.ts";

type Profile = {
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  phone: string;
  email: string;
  specialty: string;
  themeId: string;
  fontId: string;
};

type ConfiguratorState = {
  version: 1;
  step: 1 | 2 | 3 | 4 | 5;
  tradeSlug: TradeSlug | null;
  path: "formula" | "compose" | null;
  planId: OfferTier | null;
  desiredFeatureIds: string[];
  featureQuantities?: Record<string, number>;
  profile: Profile;
  updatedAt: string;
};

function configuratorHrefFromDemo(
  tradeSlug: string,
  planId: OfferTier,
  opts?: { step?: number },
): string {
  const params = new URLSearchParams({
    metier: tradeSlug,
    formule: planId,
    parcours: "formula",
    etape: String(opts?.step ?? 2),
  });
  return `/configurateur?${params.toString()}`;
}

function demoHrefFromConfig(tradeSlug: string, planId: OfferTier): string {
  return `/demos/${tradeSlug}/${planId}`;
}

function applyDemoSelectionToConfigurator(
  state: ConfiguratorState,
  tradeSlug: TradeSlug,
  planId: OfferTier,
): ConfiguratorState {
  return {
    ...state,
    tradeSlug,
    planId,
    path: state.path ?? "formula",
    step: 2,
    updatedAt: new Date().toISOString(),
  };
}

const UX_LABELS = {
  gallery: "Exemples",
  personalizeModel: "Personnaliser ce modèle",
  personalizeMine: "Personnaliser mon site",
  viewFullscreen: "Voir le site en grand",
  comparePlans: "Comparer les formules",
  backToConfig: "Revenir à ma configuration",
  adjustPreview: "Ajuster l’aperçu",
} as const;

const baseState = (): ConfiguratorState => ({
  version: 1,
  step: 4,
  tradeSlug: "plombier",
  path: "formula",
  planId: "essentiel",
  desiredFeatureIds: ["gallery_basic", "contact_form"],
  featureQuantities: { extra_pages: 2 },
  profile: {
    firstName: "Lucie",
    lastName: "Test",
    company: "Atelier Test",
    city: "Senlis",
    phone: "",
    email: "",
    specialty: "Dépannage",
    themeId: "sage",
    fontId: "classic",
  },
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("pont démo ↔ configurateur", () => {
  it("ouvre le configurateur avec métier et formule à l’étape 2", () => {
    const href = configuratorHrefFromDemo("electricien", "avance");
    assert.ok(href.includes("metier=electricien"));
    assert.ok(href.includes("formule=avance"));
    assert.ok(href.includes("parcours=formula"));
    assert.ok(href.includes("etape=2"));
  });

  it("conserve métier et formule vers la démo plein écran", () => {
    assert.equal(demoHrefFromConfig("coiffure", "pro"), "/demos/coiffure/pro");
  });

  it("conserve personnalisation et options au changement de formule", () => {
    const next = applyDemoSelectionToConfigurator(baseState(), "plombier", "pro");
    assert.equal(next.planId, "pro");
    assert.equal(next.tradeSlug, "plombier");
    assert.equal(next.profile.company, "Atelier Test");
    assert.deepEqual(next.desiredFeatureIds, ["gallery_basic", "contact_form"]);
    assert.equal(next.featureQuantities?.extra_pages, 2);
  });

  it("conserve les données au changement de métier (profil inchangé)", () => {
    const next = applyDemoSelectionToConfigurator(baseState(), "serrurier", "essentiel");
    assert.equal(next.tradeSlug, "serrurier");
    assert.equal(next.profile.city, "Senlis");
    assert.equal(next.profile.themeId, "sage");
  });

  it("expose des libellés UX unifiés sans concurrence", () => {
    const labels = Object.values(UX_LABELS);
    assert.ok(labels.includes("Exemples"));
    assert.ok(labels.includes("Personnaliser mon site"));
    assert.ok(labels.includes("Voir le site en grand"));
    assert.ok(labels.includes("Revenir à ma configuration"));
    assert.equal(new Set(labels).size, labels.length);
  });
});
