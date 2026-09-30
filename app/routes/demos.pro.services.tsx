import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";

export default function DemoProServices() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container">
        <h1>Expertise & prestations</h1>
        {trade.services.map((s, i) => (
          <article
            key={s.title}
            className="grid grid-2"
            style={{ alignItems: "center", marginBottom: "2rem", gap: "1.5rem" }}
          >
            {i % 2 === 0 && (
              <img
                src={trade.projects[i % trade.projects.length]?.image.src ?? trade.atelier.src}
                alt=""
                style={{ borderRadius: "var(--radius)", objectFit: "cover", width: "100%", aspectRatio: "16/10" }}
              />
            )}
            <div>
              <h2>{s.title}</h2>
              {s.priceFrom && <p className="text-muted">Indicatif dès {s.priceFrom}</p>}
              <p>{s.description}</p>
              <Link to={`/demos/${trade.slug}/pro/devis`} className="btn btn-primary">
                Estimer ce type de travaux
              </Link>
            </div>
            {i % 2 === 1 && (
              <img
                src={trade.projects[i % trade.projects.length]?.image.src ?? trade.atelier.src}
                alt=""
                style={{ borderRadius: "var(--radius)", objectFit: "cover", width: "100%", aspectRatio: "16/10" }}
              />
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
