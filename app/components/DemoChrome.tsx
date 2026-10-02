import { useLocation, Link } from "react-router";
import { useState } from "react";
import type { OfferTier } from "~/data/types";
import { tierLabels } from "~/data/offers";
import { Personalizer } from "~/components/Personalizer";
import { switchDemoTier } from "~/lib/demoMedia";

type Props = {
  tradeLabel: string;
  tradeSlug: string;
  tier: OfferTier;
};

const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

export function DemoChrome({ tradeLabel, tradeSlug, tier }: Props) {
  const [showPersonalizer, setShowPersonalizer] = useState(false);
  const location = useLocation();

  return (
    <div className="demo-chrome">
      <div className="container demo-chrome__inner">
        <div className="demo-chrome__left">
          <p style={{ margin: 0 }}>
            Démo {tierLabels[tier]} — {tradeLabel} ·{" "}
            <Link to="/demos">Toutes les démos</Link>
          </p>
          <div className="demo-tier-switch" role="navigation" aria-label="Changer d’offre démo">
            {TIERS.map((t) => (
              <Link
                key={t}
                to={switchDemoTier(location.pathname, tradeSlug, tier, t)}
                className={t === tier ? "is-active" : undefined}
                aria-current={t === tier ? "page" : undefined}
              >
                {tierLabels[t]}
              </Link>
            ))}
          </div>
        </div>
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
          <Personalizer compact variant="light" />
        </div>
      )}
    </div>
  );
}
