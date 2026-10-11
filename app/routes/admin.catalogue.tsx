import { useEffect, useMemo, useState, type FormEvent } from "react";
import { TRADE_SLUGS, trades } from "~/data/trades";
import type { CatalogFeature, CatalogPlan } from "~/data/catalog/types";
import type { CatalogPlanFeature } from "~/data/catalog/types";
import {
  loadAdminCatalog,
  replaceTradeRecommendations,
  updateFeatureAdmin,
  updatePlanFeatureInclusion,
  updatePlanSetupPrice,
} from "~/lib/catalog/api";
import { PLAN_INCLUSION_ARBITRATION } from "~/lib/catalog/optionAvailability";
import { centsToEuroLabel } from "~/lib/catalog/pricing";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";

export const meta = () => [{ title: "Catalogue & tarifs — Administration" }];

type Tab = "plans" | "features" | "trades" | "inclusions";

export default function AdminCatalogue() {
  const [tab, setTab] = useState<Tab>("plans");
  const [loading, setLoading] = useState(true);
  const [migrationPending, setMigrationPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [plans, setPlans] = useState<CatalogPlan[]>([]);
  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [tradeFeatures, setTradeFeatures] = useState<
    { tradeSlug: string; featureId: string; sortOrder: number; note: string | null }[]
  >([]);
  const [planFeatures, setPlanFeatures] = useState<CatalogPlanFeature[]>([]);
  const [featureQuery, setFeatureQuery] = useState("");
  const [featureCategory, setFeatureCategory] = useState<string>("all");
  const [selectedTrade, setSelectedTrade] = useState(TRADE_SLUGS[0]);
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    const res = await loadAdminCatalog();
    setMigrationPending(res.state === "migration_pending");
    if (res.state === "error") setError(res.message ?? "Erreur de chargement");
    if (res.state === "migration_pending") {
      setOk(null);
    }
    setPlans(res.catalog.plans);
    setFeatures(res.catalog.featuresAdmin);
    setTradeFeatures(res.catalog.tradeFeatures);
    setPlanFeatures(res.catalog.planFeatures);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  const filteredFeatures = useMemo(() => {
    const q = featureQuery.trim().toLowerCase();
    return features.filter((f) => {
      if (featureCategory !== "all" && f.category !== featureCategory) return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
      );
    });
  }, [features, featureQuery, featureCategory]);

  const tradeRecs = useMemo(
    () =>
      tradeFeatures
        .filter((t) => t.tradeSlug === selectedTrade)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [tradeFeatures, selectedTrade],
  );

  async function onSavePlan(plan: CatalogPlan, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setError(null);
    if (migrationPending) {
      setError("Catalogue à initialiser dans Supabase");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const euros = Number(String(fd.get("price_euros") ?? "").replace(",", "."));
    if (!Number.isFinite(euros) || euros < 0) {
      setError("Prix invalide");
      return;
    }
    const cents = Math.round(euros * 100);
    setSaving(true);
    const res = await updatePlanSetupPrice(plan.id, cents);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setOk(`Formule ${plan.name} mise à jour.`);
    await reload();
  }

  async function onSaveFeature(feature: CatalogFeature, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setError(null);
    if (migrationPending) {
      setError("Catalogue à initialiser dans Supabase");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const setupRaw = String(fd.get("setup_euros") ?? "").trim();
    const recurringRaw = String(fd.get("recurring_euros") ?? "").trim();
    const setupPriceCents =
      setupRaw === "" ? null : Math.round(Number(setupRaw.replace(",", ".")) * 100);
    const recurringPriceCents =
      recurringRaw === "" ? null : Math.round(Number(recurringRaw.replace(",", ".")) * 100);
    const configRaw = String(fd.get("config_minutes") ?? "").trim();

    setSaving(true);
    const res = await updateFeatureAdmin({
      id: feature.id,
      name: String(fd.get("name") ?? feature.name),
      description: String(fd.get("description") ?? feature.description),
      setupPriceCents:
        setupPriceCents != null && Number.isFinite(setupPriceCents) ? setupPriceCents : null,
      recurringPriceCents:
        recurringPriceCents != null && Number.isFinite(recurringPriceCents)
          ? recurringPriceCents
          : null,
      isAvailable: fd.get("is_available") === "on",
      status: fd.get("status") === "published" ? "published" : "draft",
      commercialKind: String(
        fd.get("commercial_kind") ?? feature.commercialKind,
      ) as CatalogFeature["commercialKind"],
      configMinutes: configRaw === "" ? null : Number(configRaw),
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setOk(`Fonctionnalité « ${feature.name} » enregistrée.`);
    await reload();
  }

  async function onSaveTrade(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOk(null);
    setError(null);
    if (migrationPending) {
      setError("Catalogue à initialiser dans Supabase");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const raw = String(fd.get("recs") ?? "");
    const items = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [featureId, ...noteParts] = line.split("|").map((s) => s.trim());
        return {
          featureId,
          sortOrder: (index + 1) * 10,
          note: noteParts.join("|") || null,
        };
      })
      .filter((item) => item.featureId);

    setSaving(true);
    const res = await replaceTradeRecommendations(selectedTrade, items);
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setOk(`Recommandations ${trades[selectedTrade].label} enregistrées.`);
    await reload();
  }

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState label="Chargement du catalogue…" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Catalogue & tarifs</h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Formules, fonctionnalités, options et recommandations par métier.
          </p>
        </div>
      </header>

      {migrationPending && (
        <div className="catalog-banner catalog-banner--warn" role="status">
          <strong>Catalogue à initialiser dans Supabase</strong>
          <p>
            Les tables ne sont pas encore disponibles sur ce projet. Les données affichées
            proviennent du catalogue de secours local. Aucune modification ne sera enregistrée
            tant que la migration{" "}
            <code>20261011_catalog_offers_features.sql</code> n’aura pas été appliquée sur un
            environnement de développement.
          </p>
        </div>
      )}

      {error && <ErrorState message={error} />}
      {ok && (
        <p className="catalog-banner catalog-banner--ok" role="status">
          {ok}
        </p>
      )}

      <div className="catalog-tabs" role="tablist" aria-label="Sections catalogue">
        {(
          [
            ["plans", "Formules"],
            ["features", "Fonctionnalités"],
            ["trades", "Métiers"],
            ["inclusions", "Inclusions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`catalog-tabs__btn${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="catalog-panel">
          <p className="text-muted">
            Prix de création en euros. Devise EUR — stockés en centimes en base.
          </p>
          <div className="catalog-cards">
            {plans.map((plan) => (
              <form
                key={plan.id}
                className="catalog-card"
                onSubmit={(e) => void onSavePlan(plan, e)}
              >
                <h2>{plan.name}</h2>
                <p className="text-muted">{plan.description}</p>
                <p>
                  Actuel : <strong>{centsToEuroLabel(plan.setupPriceCents)}</strong>
                  {" · "}
                  <span className="catalog-pill">{plan.status}</span>
                </p>
                <label>
                  Nouveau prix de création (€)
                  <input
                    name="price_euros"
                    type="number"
                    min={0}
                    step={1}
                    defaultValue={plan.setupPriceCents / 100}
                    disabled={migrationPending || saving}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={migrationPending || saving}
                >
                  {migrationPending ? "Enregistrement indisponible" : "Enregistrer le prix"}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {tab === "features" && (
        <div className="catalog-panel">
          <div className="catalog-toolbar">
            <label>
              Recherche
              <input
                value={featureQuery}
                onChange={(e) => setFeatureQuery(e.target.value)}
                placeholder="Nom, id…"
              />
            </label>
            <label>
              Catégorie
              <select
                value={featureCategory}
                onChange={(e) => setFeatureCategory(e.target.value)}
              >
                <option value="all">Toutes</option>
                <option value="presentation">Présentation</option>
                <option value="interactions">Interactions</option>
                <option value="services">Services</option>
              </select>
            </label>
          </div>
          <div className="catalog-feature-list">
            {filteredFeatures.map((feature) => (
              <form
                key={feature.id}
                className="catalog-card catalog-card--feature"
                onSubmit={(e) => void onSaveFeature(feature, e)}
              >
                <div className="catalog-card__head">
                  <h2>{feature.name}</h2>
                  <code>{feature.id}</code>
                </div>
                <p className="text-muted" style={{ marginTop: 0 }}>
                  {feature.category} · {feature.commercialKind} · {feature.devStatus}
                </p>
                <label>
                  Nom commercial
                  <input
                    name="name"
                    defaultValue={feature.name}
                    disabled={migrationPending || saving}
                    required
                  />
                </label>
                <label>
                  Description client
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={feature.description}
                    disabled={migrationPending || saving}
                  />
                </label>
                <div className="catalog-grid-2">
                  <label>
                    Prix création (€)
                    <input
                      name="setup_euros"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={
                        feature.setupPriceCents != null ? feature.setupPriceCents / 100 : ""
                      }
                      disabled={migrationPending || saving}
                      placeholder="vide = non tarifé"
                    />
                  </label>
                  <label>
                    Prix récurrent (€)
                    <input
                      name="recurring_euros"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={
                        feature.recurringPriceCents != null
                          ? feature.recurringPriceCents / 100
                          : ""
                      }
                      disabled={migrationPending || saving}
                      placeholder="vide = aucun"
                    />
                  </label>
                </div>
                <div className="catalog-grid-2">
                  <label>
                    Statut publication
                    <select
                      name="status"
                      defaultValue={feature.status}
                      disabled={migrationPending || saving}
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                  </label>
                  <label>
                    Kind commercial
                    <select
                      name="commercial_kind"
                      defaultValue={feature.commercialKind}
                      disabled={migrationPending || saving}
                    >
                      <option value="included">Incluse</option>
                      <option value="optional_priced">Option tarifée</option>
                      <option value="optional_unpriced">Option sans prix</option>
                      <option value="study">Étude</option>
                      <option value="unavailable">Indisponible</option>
                      <option value="not_developed">Non développée</option>
                    </select>
                  </label>
                </div>
                <label>
                  Temps estimé interne (minutes)
                  <input
                    name="config_minutes"
                    type="number"
                    min={0}
                    defaultValue={feature.internal?.configMinutes ?? ""}
                    disabled={migrationPending || saving}
                  />
                </label>
                <label className="catalog-check">
                  <input
                    type="checkbox"
                    name="is_available"
                    defaultChecked={feature.isAvailable}
                    disabled={migrationPending || saving}
                  />
                  Disponible
                </label>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={migrationPending || saving}
                >
                  {migrationPending ? "Enregistrement indisponible" : "Enregistrer"}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {tab === "trades" && (
        <div className="catalog-panel">
          <label>
            Métier
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value as typeof selectedTrade)}
            >
              {TRADE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {trades[slug].label}
                </option>
              ))}
            </select>
          </label>
          <form onSubmit={(e) => void onSaveTrade(e)} className="catalog-card">
            <h2>Recommandations — {trades[selectedTrade].label}</h2>
            <p className="text-muted">
              Une ligne par fonctionnalité : <code>feature_id | note</code>. Ordre = ordre
              d’affichage.
            </p>
            <textarea
              name="recs"
              rows={8}
              defaultValue={tradeRecs
                .map((r) => `${r.featureId}${r.note ? ` | ${r.note}` : ""}`)
                .join("\n")}
              key={`${selectedTrade}-${tradeRecs.map((r) => r.featureId).join(",")}`}
              disabled={migrationPending || saving}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={migrationPending || saving}
            >
              {migrationPending ? "Enregistrement indisponible" : "Enregistrer les recommandations"}
            </button>
          </form>
        </div>
      )}

      {tab === "inclusions" && (
        <div className="catalog-panel">
          <p className="text-muted">
            Inclusion par formule (<code>included</code> / <code>optional</code> /{" "}
            <code>unavailable</code>). Ne modifie pas les prix. Les propositions ci-dessous ne sont{" "}
            <strong>pas</strong> appliquées automatiquement.
          </p>
          <div className="catalog-card">
            <h2>Arbitrages proposés (Lot 5)</h2>
            <ul>
              {PLAN_INCLUSION_ARBITRATION.map((row) => (
                <li key={`${row.planId}-${row.featureId}`}>
                  <strong>
                    {row.planId} · {row.featureId}
                  </strong>{" "}
                  → {row.proposal} — {row.note}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ marginLeft: "0.5rem" }}
                    disabled={migrationPending || saving}
                    onClick={() => {
                      void (async () => {
                        setSaving(true);
                        setError(null);
                        setOk(null);
                        const res = await updatePlanFeatureInclusion({
                          planId: row.planId,
                          featureId: row.featureId,
                          inclusion: row.proposal,
                        });
                        setSaving(false);
                        if (!res.ok) setError(res.message);
                        else {
                          setOk(`Inclusion ${row.planId}/${row.featureId} → ${row.proposal}`);
                          await reload();
                        }
                      })();
                    }}
                  >
                    Appliquer
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="catalog-card">
            <h2>Matrice actuelle (extrait)</h2>
            <p className="text-muted">{planFeatures.length} associations chargées.</p>
            <ul style={{ maxHeight: "16rem", overflow: "auto" }}>
              {planFeatures
                .filter((l) => l.inclusion === "unavailable")
                .slice(0, 40)
                .map((l) => (
                  <li key={`${l.planId}-${l.featureId}`}>
                    {l.planId} · {l.featureId} · unavailable
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
