import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { artisanName } from "~/lib/personalize";
import { useDemoHref } from "~/lib/useDemoPaths";

export default function DemoAvanceHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const devisHref = useDemoHref(trade.slug, "/avance/devis");
  const realisationsHref = useDemoHref(trade.slug, "/avance/realisations");

  return (
    <main className="container">
      <section className="sg-hero hero-fade">
        <div>
          <p className="sg-kicker">{trade.label}</p>
          <h1>{trade.tagline}</h1>
          <p className="lead">{trade.specialty}</p>
          <p style={{ marginTop: "1.25rem" }}>{trade.about.slice(0, 280)}…</p>
          <p>
            <strong>{artisanName(trade)}</strong> — {trade.defaultCity}
          </p>
          <div className="hero-actions">
            <Link to={devisHref} className="btn btn-primary">
              Demander un devis
            </Link>
            <Link to={realisationsHref} className="btn btn-ghost">
              Voir les réalisations
            </Link>
          </div>
        </div>
        <div className="sg-hero__media">
          <img src={trade.hero.src} alt={trade.hero.alt} />
          <img className="sg-hero__overlap" src={trade.atelier.src} alt={trade.atelier.alt} />
        </div>
      </section>
    </main>
  );
}
