import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { fontPresets, themePresets } from "~/data/stylePresets";
import { STATIC_FEATURES, toPublicFeature } from "~/data/catalog/staticCatalog";
import type { CatalogFeaturePublic, PublicCatalog } from "~/data/catalog/types";
import type { OfferTier, TradeSlug } from "~/data/types";
import { loadPublicCatalog } from "~/lib/catalog/api";
import { classifyOption } from "~/lib/catalog/optionAvailability";
import { centsToEuroLabel } from "~/lib/catalog/pricing";
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
import type { ConfiguratorState, ConfiguratorStep } from "~/lib/configurator/types";
import { demoHrefFromConfig, UX_LABELS } from "~/lib/configurator/bridge";
import { ensureClientLocalId } from "~/lib/commercial/buildPayload";
import { ConfigurationRecap } from "./ConfigurationRecap";
import { SitePreview } from "./SitePreview";
import { PricePanel } from "./PricePanel";

const STEPS: { id: ConfiguratorStep; label: string }[] = [
  { id: 1, label: "Métier" },
  { id: 2, label: "Parcours" },
  { id: 3, label: "Identité" },
  { id: 4, label: "Fonctionnalités" },
  { id: 5, label: "Récapitulatif" },
];

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
    setState(loaded);
    setMounted(true);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    void loadPublicCatalog().then((res) => {
      if (!active) return;
      setCatalog(res.catalog);
      setCatalogStatus(res.status === "ready" ? "ready" : res.status === "error" ? "error" : "migration_pending");
      if (res.status === "error") setCatalogMessage(res.message);
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

  // Purge localStorage des options incompatibles (quote_form unavailable, etc.)
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

  const go = (step: ConfiguratorStep) => update({ step });

  const canContinue = (): boolean => {
    if (state.step === 1) return Boolean(state.tradeSlug);
    if (state.step === 2) {
      if (state.path === "formula") return Boolean(state.planId);
      return state.path === "compose";
    }
    if (state.step === 3) return Boolean(state.profile.company.trim());
    if (state.step === 4) return Boolean(state.planId);
    return true;
  };

  const onContinue = () => {
    if (!canContinue()) return;
    if (
      state.step === 4 &&
      !state.planId &&
      recommendation?.bestPlanId
    ) {
      update({ planId: recommendation.bestPlanId, step: 5 });
      return;
    }
    if (state.step < 5) go((state.step + 1) as ConfiguratorStep);
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
    if (feature.setupPriceCents != null) {
      const base = `+${centsToEuroLabel(feature.setupPriceCents)}`;
      return feature.externalProviderId
        ? `${base} (mise en place — abonnement prestataire à part)`
        : base;
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

  if (!mounted || !catalog) {
    return (
      <div className="cfg-loading">
        <p>Préparation de votre configurateur…</p>
      </div>
    );
  }

  const trade = state.tradeSlug ? trades[state.tradeSlug] : null;
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

  return (
    <div className="cfg-shell">
      <div className="cfg-shell__main">
        <header className="cfg-header">
          <p className="eyebrow">Configurateur</p>
          <h1>Votre savoir-faire mérite d’être visible.</h1>
          <p className="lead">
            Vous n’avez pas besoin d’être à l’aise avec l’informatique. En quelques étapes, vous
            composez votre futur site et voyez son tarif évoluer.
          </p>
          <ol className="cfg-steps" aria-label="Progression">
            {STEPS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`cfg-steps__btn${state.step === s.id ? " is-active" : ""}${state.step > s.id ? " is-done" : ""}`}
                  onClick={() => go(s.id)}
                  aria-current={state.step === s.id ? "step" : undefined}
                >
                  <span aria-hidden>{s.id}</span>
                  {s.label}
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="cfg-layout">
          <div className="cfg-panel">
            {state.step === 1 && (
              <section aria-labelledby="cfg-step1">
                <h2 id="cfg-step1">Quel est votre métier ?</h2>
                <p className="text-muted">
                  Ce choix adapte les exemples, les recommandations et l’aperçu à votre activité.
                </p>
                <div className="cfg-trade-grid">
                  {TRADE_SLUGS.map((slug) => {
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
            )}

            {state.step === 2 && (
              <section aria-labelledby="cfg-step2">
                <h2 id="cfg-step2">Comment souhaitez-vous commencer ?</h2>
                <div className="cfg-path-grid">
                  <button
                    type="button"
                    className={`cfg-path-card${state.path === "formula" ? " is-selected" : ""}`}
                    onClick={() => update({ path: "formula" })}
                  >
                    <h3>Choisir une formule</h3>
                    <p>
                      Vous préférez une solution prête à l’emploi ? Découvrez nos trois formules et
                      personnalisez ensuite votre site.
                    </p>
                  </button>
                  <button
                    type="button"
                    className={`cfg-path-card${state.path === "compose" ? " is-selected" : ""}`}
                    onClick={() => update({ path: "compose", planId: state.planId })}
                  >
                    <h3>Composer mon site</h3>
                    <p>
                      Choisissez les fonctionnalités qui vous intéressent. Nous vous proposerons la
                      formule la plus adaptée à votre projet.
                    </p>
                  </button>
                </div>

                {state.path === "formula" && (
                  <div className="cfg-plan-grid">
                    {catalog.plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        className={`cfg-plan-card${state.planId === plan.id ? " is-selected" : ""}`}
                        onClick={() => update({ planId: plan.id as OfferTier, path: "formula" })}
                      >
                        <strong>{plan.name}</strong>
                        <span className="cfg-plan-card__price">
                          {centsToEuroLabel(plan.setupPriceCents)}
                        </span>
                        <span>{plan.description}</span>
                      </button>
                    ))}
                  </div>
                )}

                {state.path === "compose" && (
                  <p className="cfg-hint">
                    À l’étape suivante vous personnalisez votre entreprise, puis vous choisissez vos
                    fonctionnalités. Une recommandation de formule vous sera proposée.
                  </p>
                )}
              </section>
            )}

            {state.step === 3 && (
              <section aria-labelledby="cfg-step3">
                <h2 id="cfg-step3">Personnalisez votre entreprise</h2>
                <p className="text-muted">
                  Ces informations alimentent aussi les démonstrations. Vous pourrez les modifier à
                  tout moment.
                </p>
                <div className="cfg-form-grid">
                  <label>
                    Nom de votre entreprise
                    <input
                      value={state.profile.company}
                      onChange={(e) =>
                        update({ profile: { ...state.profile, company: e.target.value } })
                      }
                      autoComplete="organization"
                      required
                    />
                  </label>
                  <label>
                    Ville / secteur
                    <input
                      value={state.profile.city}
                      onChange={(e) =>
                        update({ profile: { ...state.profile, city: e.target.value } })
                      }
                    />
                  </label>
                  <label>
                    Votre prénom
                    <input
                      value={state.profile.firstName}
                      onChange={(e) =>
                        update({ profile: { ...state.profile, firstName: e.target.value } })
                      }
                      autoComplete="given-name"
                    />
                  </label>
                  <label>
                    Spécialité (facultatif)
                    <input
                      value={state.profile.specialty}
                      onChange={(e) =>
                        update({ profile: { ...state.profile, specialty: e.target.value } })
                      }
                      placeholder={trade?.specialty}
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
                      onClick={() =>
                        update({ profile: { ...state.profile, themeId: theme.id } })
                      }
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
            )}

            {state.step === 4 && (
              <section aria-labelledby="cfg-step4">
                <h2 id="cfg-step4">Vos fonctionnalités</h2>
                {recommendation?.message && (
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

                {!state.planId && state.path === "compose" && (
                  <div className="cfg-plan-grid" style={{ marginBottom: "1.25rem" }}>
                    {catalog.plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        className={`cfg-plan-card${state.planId === plan.id ? " is-selected" : ""}`}
                        onClick={() => update({ planId: plan.id })}
                      >
                        <strong>{plan.name}</strong>
                        <span className="cfg-plan-card__price">
                          {centsToEuroLabel(plan.setupPriceCents)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <h3>Recommandé pour votre activité</h3>
                <div className="cfg-feature-list">
                  {recommendedFeatures.length === 0 && (
                    <p className="text-muted">Aucune recommandation spécifique pour ce métier.</p>
                  )}
                  {recommendedFeatures.map(({ id, feature }) => {
                    if (!feature) return null;
                    const checked = state.desiredFeatureIds.includes(id);
                    const included = includedForPlan.has(id);
                    const av = state.planId
                      ? classifyOption(catalog, state.planId, id)
                      : null;
                    const disabled =
                      !included &&
                      (av ? !av.selectable : false);
                    const priceLabel = featurePriceLabel(feature, included);
                    return (
                      <label
                        key={id}
                        className={`cfg-feature${checked || included ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked || included}
                          disabled={included || disabled}
                          onChange={() => toggleFeature(id)}
                        />
                        <span>
                          <strong>{feature.name}</strong>
                          <em>{priceLabel}</em>
                          <small>{feature.description}</small>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <h3>Toutes les fonctionnalités</h3>
                {(["presentation", "interactions", "services"] as const).map((cat) => {
                  const items = otherFeatures.filter((f) => f.category === cat);
                  if (!items.length) return null;
                  return (
                    <div key={cat} className="cfg-feature-group">
                      <h4>{CATEGORY_LABELS[cat]}</h4>
                      <div className="cfg-feature-list">
                        {items.map((feature) => {
                          const included = includedForPlan.has(feature.id);
                          const checked = state.desiredFeatureIds.includes(feature.id);
                          const av = state.planId
                            ? classifyOption(catalog, state.planId, feature.id)
                            : null;
                          const disabled = !included && (av ? !av.selectable : false);
                          const priceLabel = featurePriceLabel(feature, included);
                          return (
                            <label
                              key={feature.id}
                              className={`cfg-feature${checked || included ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked || included}
                                disabled={included || disabled}
                                onChange={() => toggleFeature(feature.id)}
                              />
                              <span>
                                <strong>{feature.name}</strong>
                                <em>{priceLabel}</em>
                                <small>{feature.description}</small>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </section>
            )}

            {state.step === 5 && (
              <section aria-labelledby="cfg-step5" className="cfg-step5">
                <h2 id="cfg-step5" className="visually-hidden">
                  Votre futur site et son prix
                </h2>
                {catalogStatus !== "ready" && (
                  <p className="cfg-price__warn" role="status">
                    {catalogStatus === "migration_pending"
                      ? "Catalogue de secours (STATIC) — les prix Supabase DEV ne s’appliquent pas tant que le catalogue n’est pas « ready »."
                      : catalogMessage || "Catalogue non chargé depuis Supabase."}
                  </p>
                )}
                {recommendation?.message && <p className="cfg-reco">{recommendation.message}</p>}
                <ConfigurationRecap
                  state={state}
                  catalog={catalog}
                  catalogStatus={catalogStatus}
                  hideActions
                  onPrint={() => {
                    saveConfiguratorState(state);
                    window.open("/configurateur/simulation", "_blank", "noopener,noreferrer");
                  }}
                />
              </section>
            )}

            <div className={`cfg-nav${state.step === 5 ? " cfg-nav--sticky" : ""}`}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={state.step === 1}
                onClick={() => go((state.step - 1) as ConfiguratorStep)}
              >
                {state.step === 5 ? "Modifier mes choix" : "Précédent"}
              </button>
              <div className="cfg-nav__right">
                {state.step < 5 && (
                  <button type="button" className="btn btn-ghost" onClick={onReset}>
                    {confirmReset ? "Confirmer recommencer" : "Recommencer"}
                  </button>
                )}
                {state.step < 5 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canContinue()}
                    onClick={onContinue}
                  >
                    Continuer
                  </button>
                ) : (
                  <>
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
                        window.open("/configurateur/simulation", "_blank", "noopener,noreferrer");
                      }}
                    >
                      Imprimer
                    </button>
                    <Link to="/configurateur/demande" className="btn btn-primary">
                      Demander à être contacté
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          <aside className="cfg-side">
            <button
              type="button"
              className="cfg-preview-toggle btn btn-outline"
              onClick={() => setPreviewOpen((v) => !v)}
              aria-expanded={previewOpen}
            >
              {previewOpen ? "Masquer l’aperçu" : "Voir l’aperçu du site"}
            </button>
            <div className={`cfg-side__sticky${previewOpen ? " is-open" : ""}`}>
              {state.step < 5 && (
                <SitePreview
                  tradeSlug={state.tradeSlug}
                  planId={state.planId}
                  profile={state.profile}
                  selectedFeatureIds={[
                    ...includedForPlan,
                    ...state.desiredFeatureIds,
                  ]}
                />
              )}
              <PricePanel
                catalog={catalog}
                planId={state.planId}
                desiredFeatureIds={state.desiredFeatureIds}
                featureQuantities={state.featureQuantities}
                catalogStatus={catalogStatus}
                catalogMessage={catalogMessage}
                compact={state.step === 5}
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
