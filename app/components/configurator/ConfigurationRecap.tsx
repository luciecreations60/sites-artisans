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
import { quoteIsPartial } from "~/lib/configurator/recommend";
import type { ConfiguratorState } from "~/lib/configurator/types";
import { demoHrefForConfig } from "~/lib/templates/demoModules";

type Props = {
  state: ConfiguratorState;
  catalog: PublicCatalog;
  catalogStatus: "ready" | "migration_pending" | "error";
  onPrint?: () => void;
};

/** Récapitulatif détaillé « Votre futur site, en détail ». */
export function ConfigurationRecap({ state, catalog, catalogStatus, onPrint }: Props) {
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

  return (
    <article className="cfg-detail-recap" id="simulation-print">
      <header className="cfg-detail-recap__head">
        <h2>Votre futur site, en détail</h2>
        <p className="text-muted">
          Simulation commerciale — ce n’est pas un devis signé
          {contractual ? "" : " · catalogue de secours (non contractuel)"}.
        </p>
      </header>

      <section className="cfg-detail-block">
        <h3>Entreprise</h3>
        <dl className="cfg-recap">
          <div>
            <dt>Nom</dt>
            <dd>{state.profile.company || "—"}</dd>
          </div>
          <div>
            <dt>Métier</dt>
            <dd>{trade?.label ?? state.tradeSlug ?? "—"}</dd>
          </div>
          <div>
            <dt>Ville</dt>
            <dd>{state.profile.city || "—"}</dd>
          </div>
          <div>
            <dt>Spécialité</dt>
            <dd>{state.profile.specialty || trade?.specialty || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="cfg-detail-block">
        <h3>Site</h3>
        <dl className="cfg-recap">
          <div>
            <dt>Formule</dt>
            <dd>{plan?.name ?? planId}</dd>
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
            <dt>Personnalisation</dt>
            <dd>
              {themePresets.find((t) => t.id === state.profile.themeId)?.label ?? "—"} ·{" "}
              {fontPresets.find((f) => f.id === state.profile.fontId)?.label ?? "—"}
            </dd>
          </div>
          <div>
            <dt>Inclus dans la formule</dt>
            <dd>
              {quote.includedFeatureIds
                .map((id) => featureById.get(id)?.name ?? id)
                .slice(0, 12)
                .join(", ") || "—"}
              {quote.includedFeatureIds.length > 12 ? "…" : ""}
            </dd>
          </div>
        </dl>
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
              return (
                <li key={id}>
                  <span>
                    {feature?.name ?? id}
                    {qty && qty > 1 ? ` × ${qty}` : ""}
                  </span>
                  <strong>
                    {line?.kind === "option_setup" && line.amountCents != null
                      ? centsToEuroLabel(line.amountCents)
                      : line?.kind === "external"
                        ? "Prestataire externe"
                        : skipped?.kind === "study"
                          ? "Sur étude"
                          : included.has(id)
                            ? "Incluse"
                            : "À préciser"}
                  </strong>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="cfg-detail-block cfg-detail-block--costs">
        <h3>Coûts</h3>
        <div className="cfg-cost-split">
          <div>
            <h4>Payé à Sites Artisans</h4>
            <ul className="cfg-detail-lines">
              <li>
                <span>Création — formule {plan?.name}</span>
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
                <span>Total création (simulation)</span>
                <strong>{centsToEuroLabel(quote.creationSubtotalCents)}</strong>
              </li>
            </ul>
            {quote.recurringSubtotalCents > 0 && (
              <p className="cfg-price__aside">
                Maintenance / récurrents (facultatif) :{" "}
                {centsToEuroLabel(quote.recurringSubtotalCents)} — distinct de la création.
              </p>
            )}
            {partial && (
              <p className="cfg-price__partial" role="status">
                Tarif partiel — {reasons.join(". ")}. Aucun montant définitif n’est annoncé.
              </p>
            )}
          </div>
          <div>
            <h4>Payé à vos fournisseurs</h4>
            <ul className="cfg-detail-lines">
              <li>
                <span>Hébergement & nom de domaine</span>
                <em>À votre charge</em>
              </li>
              {quote.externalNotes.map((note) => (
                <li key={note}>
                  <span>{note}</span>
                  <em>Non chiffré ici</em>
                </li>
              ))}
            </ul>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              Un abonnement externe non chiffré n’est pas gratuit — {commercialNotes.hosting}
            </p>
          </div>
        </div>
      </section>

      <div className="cfg-recap-actions cfg-recap-actions--print-hide">
        {state.tradeSlug ? (
          <Link
            to={demoHrefForConfig(state.tradeSlug, planId)}
            className="btn btn-primary"
          >
            Voir la démonstration
          </Link>
        ) : null}
        <Link to="/configurateur/demande" className="btn btn-outline">
          Demander à être contacté
        </Link>
        {onPrint ? (
          <button type="button" className="btn btn-ghost" onClick={onPrint}>
            Imprimer / exporter la simulation
          </button>
        ) : null}
      </div>
    </article>
  );
}
