import { Link } from "react-router";
import { Personalizer } from "~/components/Personalizer";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { tierLabels } from "~/data/offers";
import type { OfferTier } from "~/data/types";
import { configuratorHrefFromDemo, UX_LABELS } from "~/lib/configurator/bridge";

export const meta = () => [{ title: "Exemples de sites — Sites Artisans" }];

const tiers: OfferTier[] = ["essentiel", "avance", "pro"];

export default function Demos() {
  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <p className="eyebrow">{UX_LABELS.gallery}</p>
          <h1>Des sites professionnels, trois formules.</h1>
          <p className="lead">
            Explorez les styles par métier, comparez Essentiel, Avancé et Pro, puis
            personnalisez le modèle choisi dans le configurateur — sans ressaisir vos infos.
          </p>
          <div className="hero-actions" style={{ marginTop: "1.25rem" }}>
            <Link to="/configurateur" className="btn btn-primary">
              {UX_LABELS.personalizeMine}
            </Link>
            <Link to="/comparatif" className="btn btn-outline">
              {UX_LABELS.comparePlans}
            </Link>
          </div>
        </div>
      </section>

      <section className="aw-personalizer" style={{ paddingBlock: "3rem" }}>
        <div className="container">
          <p className="eyebrow" style={{ color: "var(--eyebrow-light)" }}>
            Aperçu rapide
          </p>
          <h2 style={{ color: "#f0f4f2", marginTop: "0.35rem" }}>
            Appliquez votre identité, puis ouvrez un exemple
          </h2>
          <Personalizer variant="immersive" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: "1.5rem" }}>Galerie des 11 métiers</h2>
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
                    <div className="hero-actions" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                      <Link to={`/demos/${slug}`} className="btn btn-ghost">
                        Voir les exemples
                      </Link>
                      <Link
                        to={configuratorHrefFromDemo(slug, "essentiel")}
                        className="btn btn-primary"
                      >
                        {UX_LABELS.personalizeModel}
                      </Link>
                    </div>
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
