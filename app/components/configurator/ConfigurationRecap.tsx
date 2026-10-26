import { Link } from "react-router";
import type { PublicCatalog } from "~/data/catalog/types";
import type { OfferTier } from "~/data/types";
import { trades } from "~/data/trades";
import { fontPresets, themePresets } from "~/data/stylePresets";
import { commercialNotes } from "~/data/offers";
import {
  calculateQuote,
  catalogAllowsContractualQuote,
  centsToEuroLabel,
} from "~/lib/catalog/pricing";
import { classifyOption } from "~/lib/catalog/optionAvailability";
import { quoteIsPartial } from "~/lib/configurator/recommend";
import type { ConfiguratorState } from "~/lib/configurator/types";
import { demoHrefFromConfig, UX_LABELS } from "~/lib/configurator/bridge";

type Props = {
  state: ConfiguratorState;
  catalog: PublicCatalog;
  catalogStatus: "ready" | "migration_pending" | "error";
  onPrint?: () => void;
  /** Masque le bloc d’actions (si la barre sticky du shell les porte). */
  hideActions?: boolean;
};

/** Récapitulatif étape 5 — une composition, un total, un groupe d’actions. */
export function ConfigurationRecap({
  state,
  catalog,
  catalogStatus,
  onPrint,
  hideActions = false,
}: Props) {
  const trade = state.tradeSlug ? trades[state.tradeSlug] : null;
  const planId = state.planId as OfferTier | null;
  if (!planId) {
    return <p className="text-muted">Choisissez une formule pour afficher le détail.</p>;
  }

  const plan = catalog.plans.find((p) => p.id === planId);
  const included = new Set(
    catalog.planFeatures
      .filter((l) => l.planId === planId && l.inclusion === "included")
      .map((l) => l.featureId),
  );
  const extras = state.desiredFeatureIds.filter((id) => !included.has(id));
  const quote = calculateQuote(catalog, {
    planId,
    optionFeatureIds: extras,
    optionQuantities: state.featureQuantities,
  });
  const { partial, reasons } = quoteIsPartial(catalog, planId, state.desiredFeatureIds);
  const featureById = new Map(catalog.features.map((f) => [f.id, f]));
  const contractual = catalogAllowsContractualQuote(catalog) && catalogStatus === "ready";
  const themeLabel = themePresets.find((t) => t.id === state.profile.themeId)?.label ?? "—";
  const fontLabel = fontPresets.find((f) => f.id === state.profile.fontId)?.label ?? "—";

  return (
    <article className="cfg-detail-recap" id="simulation-print">
      <header className="cfg-detail-recap__head">
        <p className="cfg-detail-recap__eyebrow">Récapitulatif</p>
        <h2>Votre futur site</h2>
        <p className="cfg-detail-recap__lead">
          {state.profile.company || "Votre entreprise"}
          {trade ? ` · ${trade.label}` : ""}
          {state.profile.city ? ` · ${state.profile.city}` : ""}
        </p>
        <p className="text-muted cfg-detail-recap__legal">
          Simulation commerciale — ce n’est pas un devis signé
          {contractual ? "" : " · catalogue de secours (non contractuel)"}.
        </p>
      </header>

      <div className="cfg-detail-hero-price" aria-live="polite">
        <p className="cfg-detail-hero-price__label">
          {partial ? "Sous-total création chiffré" : "Prix de création (simulation)"}
        </p>
        <p className="cfg-detail-hero-price__amount">
          {centsToEuroLabel(quote.creationSubtotalCents)}
        </p>
        {partial && (
          <p className="cfg-price__partial" role="status">
            Tarif partiel — {reasons.join(". ")}. Aucun montant définitif n’est annoncé.
          </p>
        )}
      </div>

      <section className="cfg-detail-block">
        <h3>Formule & identité</h3>
        <dl className="cfg-recap cfg-recap--compact">
          <div>
            <dt>Formule</dt>
            <dd>
              {plan?.name ?? planId} — {centsToEuroLabel(quote.planSetupCents)}
            </dd>
          </div>
          <div>
            <dt>Structure</dt>
            <dd>
              {planId === "essentiel"
                ? "Vitrine one-page"
                : planId === "avance"
                  ? "Site multipage"
                  : "Site premium multipage"}
            </dd>
          </div>
          <div>
            <dt>Style</dt>
            <dd>
              {themeLabel} · {fontLabel}
            </dd>
          </div>
          <div>
            <dt>Spécialité</dt>
            <dd>{state.profile.specialty || trade?.specialty || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="cfg-detail-block">
        <h3>Inclus dans la formule</h3>
        <p className="cfg-detail-chips">
          {quote.includedFeatureIds
            .map((id) => featureById.get(id)?.name ?? id)
            .join(" · ") || "—"}
        </p>
      </section>

      <section className="cfg-detail-block">
        <h3>Options supplémentaires</h3>
        {extras.length === 0 ? (
          <p className="text-muted">Aucune option complémentaire sélectionnée.</p>
        ) : (
          <ul className="cfg-detail-lines">
            {extras.map((id) => {
              const feature = featureById.get(id);
              const line = quote.optionLines.find((l) => l.featureId === id);
              const skipped = quote.skipped.find((s) => s.featureId === id);
              const qty = state.featureQuantities?.[id];
              const av = classifyOption(catalog, planId, id);
              return (
                <li key={id}>
                  <span>
                    {feature?.name ?? id}
                    {qty && qty > 1 ? ` × ${qty}` : ""}
                    {line?.reason ? (
                      <small className="cfg-detail-lines__hint">{line.reason}</small>
                    ) : null}
                  </span>
                  <strong>
                    {line?.kind === "option_setup" && line.amountCents != null
                      ? centsToEuroLabel(line.amountCents)
                      : line?.kind === "external"
                        ? "Prestataire externe"
                        : skipped?.kind === "study"
                          ? "Sur étude"
                          : av.kind === "incompatible"
                            ? "Indisponible"
                            : "À préciser"}
                  </strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="cfg-detail-block cfg-detail-block--costs">
        <h3>Répartition des coûts</h3>
        <div className="cfg-cost-split">
          <div>
            <h4>Site AZ</h4>
            <ul className="cfg-detail-lines">
              <li>
                <span>Création — {plan?.name}</span>
                <strong>{centsToEuroLabel(quote.planSetupCents)}</strong>
              </li>
              {quote.optionLines
                .filter((l) => l.kind === "option_setup" && l.amountCents != null)
                .map((l) => (
                  <li key={`opt-${l.featureId}`}>
                    <span>{l.label}</span>
                    <strong>{centsToEuroLabel(l.amountCents!)}</strong>
                  </li>
                ))}
              <li className="cfg-detail-lines__total">
                <span>Total création</span>
                <strong>{centsToEuroLabel(quote.creationSubtotalCents)}</strong>
              </li>
            </ul>
            {quote.recurringSubtotalCents > 0 && (
              <p className="cfg-price__aside">
                Récurrents SA (facultatif) : {centsToEuroLabel(quote.recurringSubtotalCents)} — hors
                création.
              </p>
            )}
          </div>
          <div>
            <h4>Vos fournisseurs</h4>
            <ul className="cfg-detail-lines">
              <li>
                <span>Hébergement & nom de domaine (OVH ou autre)</span>
                <em>environ 2,60 € HT/mois</em>
              </li>
              {quote.externalNotes.map((note) => (
                <li key={note}>
                  <span>{note}</span>
                  <em>Abonnement à part</em>
                </li>
              ))}
            </ul>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              Un abonnement externe non chiffré n’est pas gratuit — {commercialNotes.hosting}
            </p>
          </div>
        </div>
      </section>

      {!hideActions && (
        <div className="cfg-recap-actions cfg-recap-actions--print-hide">
          <Link to="/configurateur/demande" className="btn btn-primary">
            Demander à être contacté
          </Link>
          {state.tradeSlug ? (
            <Link to={demoHrefFromConfig(state.tradeSlug, planId)} className="btn btn-outline">
              {UX_LABELS.viewFullscreen}
            </Link>
          ) : null}
          {onPrint ? (
            <button type="button" className="btn btn-ghost" onClick={onPrint}>
              Imprimer la simulation
            </button>
          ) : null}
        </div>
      )}
    </article>
  );
}
