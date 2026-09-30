import { useMemo, useState } from "react";
import type { TradeData } from "~/data/types";
import { formatEuro } from "~/lib/format";

type Props = {
  trade: TradeData;
};

export function Estimator({ trade }: Props) {
  const estimator = trade.estimator;
  const [optionId, setOptionId] = useState(estimator?.options[0]?.id ?? "");
  const [quantity, setQuantity] = useState("25");

  const total = useMemo(() => {
    if (!estimator) return 0;
    const opt = estimator.options.find((o) => o.id === optionId);
    const q = parseFloat(quantity.replace(",", ".")) || 0;
    return opt ? opt.base * q : 0;
  }, [estimator, optionId, quantity]);

  if (!estimator) {
    return (
      <p className="text-muted">
        Estimateur non disponible pour cette démo. Contactez-nous pour un devis sur mesure.
      </p>
    );
  }

  return (
    <div>
      <h3>{estimator.label}</h3>
      <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
        Montant indicatif — un devis précis nécessite une visite ou des photos.
      </p>
      <div className="grid grid-2" style={{ maxWidth: "28rem" }}>
        <div className="form-field">
          <label htmlFor="est-opt">Type de travaux</label>
          <select
            id="est-opt"
            value={optionId}
            onChange={(e) => setOptionId(e.target.value)}
          >
            {estimator.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} ({o.base} {o.unit})
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>
      <p className="estimator-result">Estimation : {formatEuro(total)}</p>
    </div>
  );
}
