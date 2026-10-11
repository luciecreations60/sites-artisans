import type { PublicCatalog } from "~/data/catalog/types";
import type { OfferTier } from "~/data/types";
import {
  calculateQuote,
  catalogAllowsContractualQuote,
  centsToEuroLabel,
} from "~/lib/catalog/pricing";
import { quoteIsPartial } from "~/lib/configurator/recommend";
import { commercialNotes } from "~/data/offers";

type Props = {
  catalog: PublicCatalog;
  planId: OfferTier | null;
  desiredFeatureIds: string[];
  catalogStatus: "ready" | "migration_pending" | "error";
  catalogMessage?: string;
};

export function PricePanel({
  catalog,
  planId,
  desiredFeatureIds,
  catalogStatus,
  catalogMessage,
}: Props) {
  if (!planId) {
    return (
      <aside className="cfg-price" aria-live="polite">
        <h2>Votre site</h2>
        <p className="text-muted">
          Choisissez une formule ou composez vos besoins pour voir le tarif évoluer.
        </p>
      </aside>
    );
  }

  const plan = catalog.plans.find((p) => p.id === planId);
  const included = new Set(
    catalog.planFeatures
      .filter((l) => l.planId === planId && l.inclusion === "included")
      .map((l) => l.featureId),
  );
  const extras = desiredFeatureIds.filter((id) => !included.has(id));
  const quote = calculateQuote(catalog, { planId, optionFeatureIds: extras });
  const { partial, reasons } = quoteIsPartial(catalog, planId, desiredFeatureIds);
  const featureById = new Map(catalog.features.map((f) => [f.id, f]));
  const verified = catalogAllowsContractualQuote(catalog) && catalogStatus === "ready";

  return (
    <aside className="cfg-price" aria-live="polite">
      <h2>Votre site</h2>
      {!verified && (
        <p className="cfg-price__warn" role="status">
          {catalogStatus === "migration_pending"
            ? "Catalogue de secours — simulation uniquement, pas de devis contractuel."
            : catalogMessage ||
              "Catalogue non vérifié — les montants restent indicatifs."}
        </p>
      )}
      <ul className="cfg-price__lines">
        <li>
          <span>Formule {plan?.name ?? planId}</span>
          <strong>{centsToEuroLabel(quote.planSetupCents)}</strong>
        </li>
        {desiredFeatureIds.map((id) => {
          const feature = featureById.get(id);
          const label = feature?.name ?? id;
          if (included.has(id)) {
            return (
              <li key={id}>
                <span>{label}</span>
                <em>Incluse</em>
              </li>
            );
          }
          const line = quote.optionLines.find((l) => l.featureId === id);
          if (line?.kind === "option_setup" && line.amountCents != null) {
            return (
              <li key={id}>
                <span>{label}</span>
                <strong>+{centsToEuroLabel(line.amountCents)}</strong>
              </li>
            );
          }
          if (line?.kind === "external") {
            return (
              <li key={id}>
                <span>{label}</span>
                <em>Prestataire externe</em>
              </li>
            );
          }
          const skipped = quote.skipped.find((s) => s.featureId === id);
          return (
            <li key={id}>
              <span>{label}</span>
              <em>
                {skipped?.kind === "study" || feature?.commercialKind === "study"
                  ? "Sur étude"
                  : "Tarif à définir"}
              </em>
            </li>
          );
        })}
      </ul>

      <div className="cfg-price__total">
        {partial ? (
          <>
            <p className="cfg-price__label">Sous-total chiffré (création)</p>
            <p className="cfg-price__amount">{centsToEuroLabel(quote.creationSubtotalCents)}</p>
            <p className="cfg-price__partial" role="status">
              Tarif partiel — {reasons.join(". ") || "certaines options ne sont pas chiffrées"}.
              Aucun prix définitif n’est annoncé.
            </p>
          </>
        ) : (
          <>
            <p className="cfg-price__label">Tarif calculé de votre configuration</p>
            <p className="cfg-price__amount">{centsToEuroLabel(quote.creationSubtotalCents)}</p>
          </>
        )}
      </div>

      {quote.recurringSubtotalCents > 0 && (
        <p className="cfg-price__aside">
          Récurrent estimé : {centsToEuroLabel(quote.recurringSubtotalCents)} (hors création)
        </p>
      )}
      {quote.externalNotes.length > 0 && (
        <p className="cfg-price__aside">Services tiers : à votre charge auprès du fournisseur.</p>
      )}
      <p className="cfg-price__footnote">{commercialNotes.hosting}</p>
      <p className="cfg-price__footnote">
        {verified
          ? "Simulation indicative — un devis ferme nécessite une validation après échange."
          : "Simulation sur catalogue de secours — aucun devis contractuel ne peut être validé ainsi."}
      </p>
    </aside>
  );
}
