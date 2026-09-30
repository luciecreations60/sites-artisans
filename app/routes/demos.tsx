import { Link } from "react-router";
import { Personalizer } from "~/components/Personalizer";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { tierLabels } from "~/data/offers";
import type { OfferTier } from "~/data/types";

export const meta = () => [{ title: "Démos — Sites Artisans" }];

const tiers: OfferTier[] = ["essentiel", "avance", "pro"];

export default function Demos() {
  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <p className="eyebrow">Les démonstrations</p>
          <h1>Un même métier, trois montées en gamme.</h1>
          <p className="lead">
            Choisissez un métier, puis une formule. Vous pouvez personnaliser les textes avec vos
            coordonnées.
          </p>
        </div>
      </section>

      <section className="aw-personalizer" style={{ paddingBlock: "3rem" }}>
        <div className="container">
          <Personalizer variant="immersive" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {TRADE_SLUGS.map((slug) => {
              const trade = trades[slug];
              return (
                <article key={slug} className="card card--interactive demo-card">
                  <img src={trade.hero.src} alt="" />
                  <div className="demo-card__body">
                    <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>
                      {trade.shortLabel}
                    </p>
                    <h2 style={{ fontSize: "1.45rem" }}>{trade.label}</h2>
                    <p className="text-muted" style={{ fontSize: "0.95rem" }}>
                      {trade.tagline}
                    </p>
                    <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                      {tiers.map((tier, i) => (
                        <span key={tier}>
                          {i > 0 && " · "}
                          <Link to={`/demos/${slug}/${tier}`}>{tierLabels[tier]}</Link>
                        </span>
                      ))}
                    </p>
                    <Link to={`/demos/${slug}`} className="btn btn-ghost">
                      Choisir une formule
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
