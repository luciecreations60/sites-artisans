import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useHref, useSearchParams } from "react-router";
import { sortedTradeSlugs, trades } from "~/data/trades";
import { fontPresets, themePresets } from "~/data/stylePresets";
import {
  getStaticPublicCatalog,
  STATIC_FEATURES,
  toPublicFeature,
} from "~/data/catalog/staticCatalog";
import type { CatalogFeaturePublic, PublicCatalog } from "~/data/catalog/types";
import type { OfferTier, TradeSlug } from "~/data/types";
import { loadPublicCatalog } from "~/lib/catalog/api";
import { classifyOption } from "~/lib/catalog/optionAvailability";
import { centsToEuroLabel, optionSetupPriceLabel } from "~/lib/catalog/pricing";
import {
  sanitizeDesiredFeatureIds,
  sanitizeFeatureQuantities,
} from "~/lib/catalog/sanitizeSelection";
import { recommendPlans } from "~/lib/configurator/recommend";
import {
  clearConfiguratorState,
  emptyConfiguratorState,
  loadConfiguratorState,
  mergeBootParams,
  saveConfiguratorState,
} from "~/lib/configurator/storage";
import type { ConfiguratorState } from "~/lib/configurator/types";
import { demoHrefFromConfig, UX_LABELS } from "~/lib/configurator/bridge";
import { ensureClientLocalId } from "~/lib/commercial/buildPayload";
import { ConfigurationRecap } from "./ConfigurationRecap";
import { SitePreview } from "./SitePreview";
import { PricePanel } from "./PricePanel";

const CATEGORY_LABELS: Record<string, string> = {
  presentation: "Présentation",
  interactions: "Interactions",
  services: "Services complémentaires",
};

function featureLookup(catalog: PublicCatalog, id: string): CatalogFeaturePublic | null {
  return (
    catalog.features.find((f) => f.id === id) ??
    (() => {
      const staticF = STATIC_FEATURES.find((f) => f.id === id);
      return staticF ? toPublicFeature(staticF) : null;
    })()
  );
}

export function ConfiguratorApp() {
  const [searchParams] = useSearchParams();
  const simulationHref = useHref("/configurateur/simulation");
  const previewRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ConfiguratorState>(() => emptyConfiguratorState());
  const [mounted, setMounted] = useState(false);
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<"ready" | "migration_pending" | "error">(
    "migration_pending",
  );
  const [catalogMessage, setCatalogMessage] = useState<string | undefined>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    const loaded = mergeBootParams(loadConfiguratorState(), {
      trade: searchParams.get("metier") ?? searchParams.get("trade"),
      formule: searchParams.get("formule") ?? searchParams.get("offre"),
      parcours: searchParams.get("parcours"),
      etape: searchParams.get("etape"),
    });
    // Studio unique : path formule par défaut si une formule est déjà choisie.
    if (!loaded.path && loaded.planId) {
      loaded.path = "formula";
    }
    if (!loaded.path) {
      loaded.path = "formula";
    }
    setState(loaded);
    setMounted(true);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void loadPublicCatalog()
      .then((res) => {
        if (!active) return;
        setCatalog(res.catalog);
        setCatalogStatus(
          res.status === "ready" ? "ready" : res.status === "error" ? "error" : "migration_pending",
        );
        if (res.status === "error") setCatalogMessage(res.message);
      })
      .catch(() => {
        if (!active) return;
        setCatalog(getStaticPublicCatalog());
        setCatalogStatus("error");
        setCatalogMessage(
          "Catalogue en ligne injoignable — simulation sur catalogue de secours (non contractuel).",
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const withId = state.clientLocalId
      ? state
      : { ...state, clientLocalId: ensureClientLocalId(state) };
    if (!state.clientLocalId && withId.clientLocalId) {
      setState(withId);
      return;
    }
    saveConfiguratorState(withId);
  }, [state, mounted]);

  useEffect(() => {
    if (!catalog || !state.planId) return;
    const nextIds = sanitizeDesiredFeatureIds(
      catalog,
      state.planId,
      state.desiredFeatureIds,
    );
    const nextQty = sanitizeFeatureQuantities(nextIds, state.featureQuantities);
    const idsChanged =
      nextIds.length !== state.desiredFeatureIds.length ||
      nextIds.some((id, i) => id !== state.desiredFeatureIds[i]);
    const qtyChanged =
      Object.keys(nextQty).length !== Object.keys(state.featureQuantities ?? {}).length ||
      Object.entries(nextQty).some(([k, v]) => state.featureQuantities?.[k] !== v);
    if (idsChanged || qtyChanged) {
      setState((prev) => ({
        ...prev,
        desiredFeatureIds: nextIds,
        featureQuantities: nextQty,
      }));
    }
  }, [catalog, state.planId, state.desiredFeatureIds, state.featureQuantities]);

  const recommendation = useMemo(() => {
    if (!catalog) return null;
    return recommendPlans(catalog, state.desiredFeatureIds, state.planId);
  }, [catalog, state.desiredFeatureIds, state.planId]);

  const update = (patch: Partial<ConfiguratorState>) => {
    setState((prev) => {
      let next = { ...prev, ...patch };
      if (catalog && (patch.planId !== undefined || patch.desiredFeatureIds)) {
        const planId = next.planId;
        const ids = sanitizeDesiredFeatureIds(catalog, planId, next.desiredFeatureIds);
        next = {
          ...next,
          desiredFeatureIds: ids,
          featureQuantities: sanitizeFeatureQuantities(ids, next.featureQuantities),
        };
      }
      return next;
    });
  };

  const toggleFeature = (id: string) => {
    if (!catalog || !state.planId) {
      setState((prev) => {
        const has = prev.desiredFeatureIds.includes(id);
        return {
          ...prev,
          desiredFeatureIds: has
            ? prev.desiredFeatureIds.filter((x) => x !== id)
            : [...prev.desiredFeatureIds, id],
        };
      });
      return;
    }
    const av = classifyOption(catalog, state.planId, id);
    if (!av.selectable && av.kind !== "included") return;
    setState((prev) => {
      const has = prev.desiredFeatureIds.includes(id);
      const desiredFeatureIds = has
        ? prev.desiredFeatureIds.filter((x) => x !== id)
        : [...prev.desiredFeatureIds, id];
      return {
        ...prev,
        desiredFeatureIds,
        featureQuantities: sanitizeFeatureQuantities(desiredFeatureIds, prev.featureQuantities),
      };
    });
  };

  const featurePriceLabel = (
    feature: CatalogFeaturePublic,
    included: boolean,
  ): string => {
    if (included) return "Incluse dans la formule";
    if (!state.planId) {
      if (feature.setupPriceCents != null) return `+${centsToEuroLabel(feature.setupPriceCents)}`;
      if (feature.billingType === "external") return "Prestataire externe";
      return "Tarif selon formule";
    }
    const av = classifyOption(catalog!, state.planId, feature.id);
    if (av.kind === "included") return "Incluse dans la formule";
    if (av.kind === "incompatible") return "Indisponible pour cette formule";
    if (av.kind === "study") return "Sur étude";
    if (av.kind === "not_developed") return "Bientôt disponible";
    if (av.kind === "unpriced" || av.kind === "unavailable") {
      return av.reason ?? "Non commercialisable";
    }
    if (feature.setupPriceCents != null && feature.recurringPriceCents != null) {
      return `${optionSetupPriceLabel(feature.id, feature.setupPriceCents)} + ${centsToEuroLabel(feature.recurringPriceCents)}/mois`;
    }
    if (feature.setupPriceCents != null) {
      const base = optionSetupPriceLabel(feature.id, feature.setupPriceCents);
      return feature.externalProviderId
        ? `${base} (mise en place — abonnement prestataire à part)`
        : base;
    }
    if (feature.recurringPriceCents != null) {
      return `${centsToEuroLabel(feature.recurringPriceCents)} / mois`;
    }
    if (feature.billingType === "external") return "Prestataire externe";
    return "Option";
  };

  const onReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    clearConfiguratorState();
    setState(emptyConfiguratorState());
    setConfirmReset(false);
  };

  const openPreview = () => {
    setPreviewOpen(true);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  if (!mounted || !catalog) {
    return (
      <div className="cfg-loading">
        <p>Préparation de votre studio…</p>
      </div>
    );
  }

  const trade = state.tradeSlug ? trades[state.tradeSlug] : null;
  const tradeSlugs = sortedTradeSlugs();
  const recommendedIds = catalog.tradeFeatures
    .filter((t) => t.tradeSlug === state.tradeSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((t) => t.featureId);

  const recommendedFeatures = recommendedIds
    .map((id) => ({ id, feature: featureLookup(catalog, id) }))
    .filter((x) => x.feature);

  const otherFeatures = catalog.features
    .filter((f) => !recommendedIds.includes(f.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const includedForPlan = new Set(
    state.planId
      ? catalog.planFeatures
          .filter((l) => l.planId === state.planId && l.inclusion === "included")
          .map((l) => l.featureId)
      : [],
  );

  const previewFeatureIds = [...includedForPlan, ...state.desiredFeatureIds];
  const canRequest = Boolean(state.tradeSlug && state.planId);

  const renderFeature = (id: string, feature: CatalogFeaturePublic) => {
    const checked = state.desiredFeatureIds.includes(id);
    const included = includedForPlan.has(id);
    const av = state.planId ? classifyOption(catalog, state.planId, id) : null;
    const disabled = !included && (av ? !av.selectable : false);
    const priceLabel = featurePriceLabel(feature, included);
    return (
      <label
        key={id}
        className={`cfg-feature${checked || included ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
      >
        <input
          type="checkbox"
          checked={checked || included}
          disabled={included || disabled || !state.planId}
          onChange={() => toggleFeature(id)}
        />
        <span>
          <strong>{feature.name}</strong>
          <em>{priceLabel}</em>
          <small>{feature.description}</small>
        </span>
      </label>
    );
  };

  return (
    <div className="cfg-shell cfg-shell--studio">
      <div className="cfg-shell__main">
        <header className="cfg-header">
          <p className="eyebrow">Studio</p>
          <h1>Personnalisez votre futur site.</h1>
          <p className="lead">
            Choisissez votre métier et votre formule, ajustez le nom, la ville et le style. L’aperçu
            et le tarif évoluent immédiatement.
          </p>
        </header>

        <div className="cfg-layout cfg-layout--studio">
          <div className="cfg-panel">
            <section aria-labelledby="cfg-trade" className="cfg-studio-section">
              <h2 id="cfg-trade">Votre métier</h2>
              <p className="text-muted">
                Ce choix adapte les exemples, les recommandations et l’aperçu à votre activité.
              </p>
              <div className="cfg-trade-grid">
                {tradeSlugs.map((slug) => {
                  const t = trades[slug];
                  return (
                    <button
                      key={slug}
                      type="button"
                      className={`cfg-trade-card${state.tradeSlug === slug ? " is-selected" : ""}`}
                      onClick={() => update({ tradeSlug: slug as TradeSlug })}
                    >
                      <img src={t.hero.src} alt="" />
                      <strong>{t.label}</strong>
                      <span>{t.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="cfg-plan" className="cfg-studio-section">
              <h2 id="cfg-plan">Votre formule</h2>
              <p className="text-muted">
                Trois formules de création. Les options ci-dessous s’ajoutent ensuite.
              </p>
              <div className="cfg-plan-grid">
                {catalog.plans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className={`cfg-plan-card${state.planId === plan.id ? " is-selected" : ""}`}
                    onClick={() =>
                      update({ planId: plan.id as OfferTier, path: "formula", step: 5 })
                    }
                  >
                    <strong>{plan.name}</strong>
                    <span className="cfg-plan-card__price">
                      {centsToEuroLabel(plan.setupPriceCents)}
                    </span>
                    <span>{plan.description}</span>
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="cfg-identity" className="cfg-studio-section">
              <h2 id="cfg-identity">Votre identité</h2>
              <p className="text-muted">
                Ces informations s’affichent tout de suite dans l’aperçu. Vous pourrez les modifier
                plus tard.
              </p>
              <div className="cfg-form-grid">
                <label>
                  Nom de votre entreprise
                  <input
                    value={state.profile.company}
                    onChange={(e) =>
                      update({ profile: { ...state.profile, company: e.target.value } })
                    }
                    placeholder={trade?.defaultCompany ?? "Ex. Dupont Plomberie"}
                    autoComplete="organization"
                  />
                </label>
                <label>
                  Ville / secteur
                  <input
                    value={state.profile.city}
                    onChange={(e) =>
                      update({ profile: { ...state.profile, city: e.target.value } })
                    }
                    placeholder={trade?.defaultCity ?? "Ex. Senlis"}
                  />
                </label>
              </div>
              <p className="style-picker__label">Couleur du thème</p>
              <div className="style-swatches" role="listbox" aria-label="Couleur du thème">
                {themePresets.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    role="option"
                    aria-selected={state.profile.themeId === theme.id}
                    className={`style-swatch${state.profile.themeId === theme.id ? " is-active" : ""}`}
                    title={theme.label}
                    onClick={() => update({ profile: { ...state.profile, themeId: theme.id } })}
                    style={{ backgroundColor: theme.accent }}
                  >
                    <span className="visually-hidden">{theme.label}</span>
                  </button>
                ))}
              </div>
              <p className="style-picker__label">Style de police</p>
              <div className="font-style-grid">
                {fontPresets.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className={`font-style-card${state.profile.fontId === font.id ? " is-active" : ""}`}
                    onClick={() => update({ profile: { ...state.profile, fontId: font.id } })}
                    style={{ fontFamily: font.display }}
                  >
                    <strong>{font.label}</strong>
                    <span>{font.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="cfg-options" className="cfg-studio-section">
              <h2 id="cfg-options">Options supplémentaires</h2>
              {!state.planId && (
                <p className="cfg-hint">Choisissez d’abord une formule pour activer les options.</p>
              )}
              {recommendation?.message && state.planId && (
                <div className="cfg-reco" role="status">
                  <p>{recommendation.message}</p>
                  {recommendation.bestPlanId && state.planId !== recommendation.bestPlanId && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => update({ planId: recommendation.bestPlanId })}
                    >
                      Choisir {catalog.plans.find((p) => p.id === recommendation.bestPlanId)?.name}
                    </button>
                  )}
                </div>
              )}

              <h3>Recommandé pour votre activité</h3>
              <div className="cfg-feature-list">
                {recommendedFeatures.length === 0 && (
                  <p className="text-muted">
                    {state.tradeSlug
                      ? "Aucune recommandation spécifique pour ce métier."
                      : "Sélectionnez un métier pour voir les suggestions."}
                  </p>
                )}
                {recommendedFeatures.map(({ id, feature }) =>
                  feature ? renderFeature(id, feature) : null,
                )}
              </div>

              <h3>Toutes les fonctionnalités</h3>
              {(["presentation", "interactions", "services"] as const).map((cat) => {
                const items = otherFeatures.filter((f) => f.category === cat);
                if (!items.length) return null;
                return (
                  <div key={cat} className="cfg-feature-group">
                    <h4>{CATEGORY_LABELS[cat]}</h4>
                    <div className="cfg-feature-list">
                      {items.map((feature) => renderFeature(feature.id, feature))}
                    </div>
                  </div>
                );
              })}
            </section>
          </div>

          <div className="cfg-side" id="cfg-preview-anchor" ref={previewRef}>
            <button
              type="button"
              className="cfg-preview-toggle btn btn-outline"
              onClick={() => {
                if (previewOpen) setPreviewOpen(false);
                else openPreview();
              }}
              aria-expanded={previewOpen}
            >
              {previewOpen ? "Masquer l’aperçu" : "Voir l’aperçu du site"}
            </button>
            <div className={`cfg-side__sticky${previewOpen ? " is-open" : ""}`}>
              <p className="cfg-side__preview-label">Aperçu en direct</p>
              <SitePreview
                tradeSlug={state.tradeSlug}
                planId={state.planId}
                profile={state.profile}
                selectedFeatureIds={previewFeatureIds}
              />
              <PricePanel
                catalog={catalog}
                planId={state.planId}
                desiredFeatureIds={state.desiredFeatureIds}
                featureQuantities={state.featureQuantities}
                catalogStatus={catalogStatus}
                catalogMessage={catalogMessage}
              />
            </div>
          </div>

          <div className="cfg-panel cfg-panel--footer">
            <section aria-labelledby="cfg-recap" className="cfg-studio-section">
              <h2 id="cfg-recap">Récapitulatif</h2>
              {catalogStatus !== "ready" && (
                <p className="cfg-price__warn" role="status">
                  {catalogStatus === "migration_pending"
                    ? "Catalogue de secours (STATIC) — les prix Supabase DEV ne s’appliquent pas tant que le catalogue n’est pas « ready »."
                    : catalogMessage || "Catalogue non chargé depuis Supabase."}
                </p>
              )}
              <ConfigurationRecap
                state={state}
                catalog={catalog}
                catalogStatus={catalogStatus}
                hideActions
                onPrint={() => {
                  saveConfiguratorState(state);
                  window.open(simulationHref, "_blank", "noopener,noreferrer");
                }}
              />
            </section>

            <div className="cfg-nav cfg-nav--sticky">
              <button type="button" className="btn btn-ghost" onClick={onReset}>
                {confirmReset ? "Confirmer recommencer" : "Recommencer"}
              </button>
              <div className="cfg-nav__right">
                {state.tradeSlug && state.planId ? (
                  <Link
                    to={demoHrefFromConfig(state.tradeSlug, state.planId)}
                    className="btn btn-ghost"
                    onClick={() => saveConfiguratorState(state)}
                  >
                    {UX_LABELS.viewFullscreen}
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    saveConfiguratorState(state);
                    window.open(simulationHref, "_blank", "noopener,noreferrer");
                  }}
                >
                  Imprimer
                </button>
                {canRequest ? (
                  <Link
                    to="/configurateur/demande"
                    className="btn btn-primary"
                    onClick={() => saveConfiguratorState(state)}
                  >
                    Demander à être contacté
                  </Link>
                ) : (
                  <button type="button" className="btn btn-primary" disabled>
                    Demander à être contacté
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="cfg-preview-fab"
        onClick={openPreview}
        aria-controls="cfg-preview-anchor"
      >
        Voir l’aperçu
      </button>
    </div>
  );
}
