import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { useDemoBasePath, useDemoSearch } from "~/lib/useDemoPaths";

export default function DemoProRealisations() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();

  return (
    <main className="section">
      <div className="container">
        <h1>Portfolio</h1>
        <p className="text-muted">Chaque projet dispose d’une fiche détaillée en formule Pro.</p>
        <div className="grid grid-2">
          {trade.projects.map((p) => (
            <Link
              key={p.id}
              to={`${basePath}/pro/realisations/${p.id}${q}`}
              className="card card--interactive"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                src={p.image.src}
                alt={p.image.alt}
                style={{ borderRadius: "8px", aspectRatio: "16/10", objectFit: "cover", width: "100%", marginBottom: "0.75rem" }}
              />
              <h2 style={{ fontSize: "1.15rem", margin: 0 }}>{p.title}</h2>
              <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9375rem" }}>
                {p.location}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
