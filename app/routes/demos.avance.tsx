import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { artisanName } from "~/lib/personalize";

export default function DemoAvanceHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container hero-fade">
        <h1>{trade.tagline}</h1>
        <p className="lead">{trade.specialty}</p>
        <img
          src={trade.hero.src}
          alt={trade.hero.alt}
          style={{ borderRadius: "var(--radius)", width: "100%", maxHeight: "400px", objectFit: "cover", marginTop: "1rem" }}
        />
        <p style={{ marginTop: "1.5rem" }}>{trade.about.slice(0, 280)}…</p>
        <p>
          <strong>{artisanName(trade)}</strong> — {trade.defaultCity}
        </p>
        <div className="hero-actions">
          <Link to={`/demos/${trade.slug}/avance/devis`} className="btn btn-primary">
            Demander un devis
          </Link>
          <Link to={`/demos/${trade.slug}/avance/realisations`} className="btn btn-ghost">
            Voir les réalisations
          </Link>
        </div>
      </div>
    </main>
  );
}
