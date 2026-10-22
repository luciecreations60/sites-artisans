import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { TradeData } from "~/data/types";
import { formatEuro } from "~/lib/format";
import { useDemoHref } from "~/lib/useDemoPaths";

type Props = {
  trade: TradeData;
  /** Les barèmes de démo sont fictifs — à remplacer par le client. */
  demoMode?: boolean;
  /** Chemin relatif après /demos/:trade (ex. /pro/devis). */
  devisPath?: string;
};

/**
 * Estimateur des prestations de l’ARTISAN (pas le prix Site AZ).
 * Réutilisable : barème porté par `trade.estimator`.
 */
export function Estimator({ trade, demoMode = true, devisPath = "/pro/devis" }: Props) {
  const estimator = trade.estimator;
  const [optionId, setOptionId] = useState(estimator?.options[0]?.id ?? "");
  const [quantity, setQuantity] = useState("25");
  const devisHref = useDemoHref(trade.slug, devisPath);

  const selected = estimator?.options.find((o) => o.id === optionId);
  const qty = parseFloat(quantity.replace(",", ".")) || 0;

  const total = useMemo(() => {
    if (!selected || !Number.isFinite(selected.base) || selected.base <= 0 || qty <= 0) {
      return null;
    }
    return selected.base * qty;
  }, [selected, qty]);

  if (!estimator || estimator.options.length === 0) {
    return (
      <div className="estimator estimator--empty">
        <h3>Estimation indicative</h3>
        <p className="text-muted">
          Aucun barème de prestations n’est renseigné pour le moment. Demandez un devis plutôt
          qu’une estimation automatique.
        </p>
        <Link to={devisHref} className="btn btn-primary">
          Demander un devis
        </Link>
      </div>
    );
  }

  return (
    <div className="estimator">
      <h3>{estimator.label}</h3>
      <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
        {demoMode
          ? "Barème de démonstration fictif — non contractuel. Sur un site client, ces montants seront les vôtres."
          : "Montant indicatif — un devis précis nécessite souvent une visite ou des photos."}
      </p>
      <div className="grid grid-2 estimator__fields">
        <div className="form-field">
          <label htmlFor="est-opt">Type de prestation</label>
          <select
            id="est-opt"
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
          >
            {estimator.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.base > 0 ? ` (${o.base} ${o.unit})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="est-qty">Surface ou quantité</label>
          <input
            id="est-qty"
            type="number"
            min={1}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>
      {total == null ? (
        <p className="estimator-result estimator-result--muted" role="status">
          Estimation non disponible pour cette combinaison — préférez une demande de devis.
        </p>
      ) : (
        <p className="estimator-result">
          Estimation indicative : {formatEuro(total)}
          {demoMode ? " (exemple)" : ""}
        </p>
      )}
      <p style={{ marginTop: "0.75rem" }}>
        <Link to={devisHref} className="btn btn-ghost">
          Transformer en demande de devis
        </Link>
      </p>
    </div>
  );
}
