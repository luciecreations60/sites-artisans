import { useState } from "react";
import { Link } from "react-router";
import type { OfferTier } from "~/data/types";
import { tierLabels } from "~/data/offers";
import { Personalizer } from "~/components/Personalizer";

type Props = {
  tradeLabel: string;
  tier: OfferTier;
};

export function DemoChrome({ tradeLabel, tier }: Props) {
  const [showPersonalizer, setShowPersonalizer] = useState(false);

  return (
    <div className="demo-chrome">
      <div className="container demo-chrome__inner">
        <p style={{ margin: 0 }}>
          Démo {tierLabels[tier]} — {tradeLabel} ·{" "}
          <Link to="/demos">Toutes les démos</Link>
        </p>
        <p style={{ margin: 0, opacity: 0.85 }}>
          Démonstration — contenu fictif ·{" "}
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "0.2rem 0.5rem", fontSize: "0.8125rem", color: "#fff", borderColor: "#ffffff55" }}
            onClick={() => setShowPersonalizer((v) => !v)}
          >
            {showPersonalizer ? "Masquer" : "Personnaliser"}
          </button>
        </p>
      </div>
      {showPersonalizer && (
        <div className="container" style={{ paddingBottom: "0.75rem" }}>
          <Personalizer compact />
        </div>
      )}
    </div>
  );
}
