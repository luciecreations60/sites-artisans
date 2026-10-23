import { Link } from "react-router";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { tierLabels } from "~/data/offers";
import { UX_LABELS } from "~/lib/configurator/bridge";

export const meta = () => [{ title: "Exemples — Site AZ" }];

/** Métiers triés par libellé (FR), pour un parcours simple. */
const TRADES_ALPHA = [...TRADE_SLUGS].sort((a, b) =>
  trades[a].label.localeCompare(trades[b].label, "fr", { sensitivity: "base" }),
);

export default function Demos() {
  return (
    <>
      <section className="section section--tight">
        <div className="container">
          <p className="eyebrow">{UX_LABELS.gallery}</p>
          <h1>Voyez ce que ça donne pour votre métier.</h1>
          <p className="lead">
            Choisissez votre activité, ouvrez un exemple. Ensuite vous pourrez le personnaliser.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="grid grid-3">
            {TRADES_ALPHA.map((slug) => {
              const trade = trades[slug];
              return (
                <article key={slug} className="demo-card demo-card--trade">
                  <Link
                    to={`/demos/${slug}/essentiel`}
                    className="demo-card__preview"
                    aria-label={`Voir un exemple de site ${trade.label}`}
                  >
                    <img src={trade.hero.src} alt="" />
                    <span className="demo-card__cta-overlay">Voir l’exemple</span>
                  </Link>
                  <div className="demo-card__body">
                    <h2 style={{ fontSize: "1.35rem", marginTop: 0 }}>{trade.label}</h2>
                    <p className="text-muted" style={{ fontSize: "0.95rem", marginBottom: "0.85rem" }}>
                      {trade.tagline}
                    </p>
                    <Link to={`/demos/${slug}/essentiel`} className="btn btn-primary">
                      Voir l’exemple
                    </Link>
                    <p className="demo-card__tiers text-muted">
                      Voir aussi{" "}
                      <Link to={`/demos/${slug}/avance`}>{tierLabels.avance}</Link>
                      {" · "}
                      <Link to={`/demos/${slug}/pro`}>{tierLabels.pro}</Link>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hero-actions" style={{ marginTop: "2.5rem", justifyContent: "center" }}>
            <Link to="/configurateur" className="btn btn-primary">
              C’est mon métier — {UX_LABELS.personalizeMine}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
