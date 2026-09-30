import { Link } from "react-router";
import { Personalizer } from "~/components/Personalizer";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { tierLabels } from "~/data/offers";
import type { OfferTier } from "~/data/types";

export const meta = () => [{ title: "Démos — Sites Artisans" }];

const tiers: OfferTier[] = ["essentiel", "avance", "pro"];

export default function Demos() {
  return (
    <section className="section">
      <div className="container">
        <h1>Démonstrations par métier</h1>
        <p className="lead">
          Choisissez un métier, puis une formule (Essentiel, Avancé ou Pro). Vous pouvez
          personnaliser les textes avec vos coordonnées.
        </p>
        <Personalizer />
        <div className="grid grid-3" style={{ marginTop: "2rem" }}>
          {TRADE_SLUGS.map((slug) => {
            const trade = trades[slug];
            return (
              <article key={slug} className="card card--interactive">
                <h2>{trade.label}</h2>
                <p className="text-muted">{trade.tagline}</p>
                <p style={{ fontSize: "0.9375rem" }}>
                  {tiers.map((tier, i) => (
                    <span key={tier}>
                      {i > 0 && " · "}
                      <Link to={`/demos/${slug}/${tier === "avance" ? "avance" : tier}`}>
                        {tierLabels[tier]}
                      </Link>
                    </span>
                  ))}
                </p>
                <Link to={`/demos/${slug}`} className="btn btn-ghost" style={{ marginTop: "0.5rem" }}>
                  Choisir une formule
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
