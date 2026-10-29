import { Link } from "react-router";
import { sortedTradeSlugs, trades } from "~/data/trades";
import { tierLabels } from "~/data/offers";

type Props = {
  /** Limite le nombre de métiers affichés (accueil). */
  limit?: number;
};

export function TradeExamplesGrid({ limit }: Props) {
  const slugs = sortedTradeSlugs().slice(0, limit);

  return (
    <div className="grid grid-3">
      {slugs.map((slug) => {
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
  );
}
