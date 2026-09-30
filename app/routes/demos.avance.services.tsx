import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";

export default function DemoAvanceServices() {
  const { trade } = useOutletContext<{ trade: TradeData }>();

  return (
    <main className="section">
      <div className="container">
        <h1>Nos services</h1>
        <p className="text-muted">Intervention à {trade.defaultCity} et alentours.</p>
        <ul style={{ listStyle: "none", padding: 0 }} className="grid grid-2">
          {trade.services.map((s) => (
            <li key={s.title} className="card">
              <h2 style={{ fontSize: "1.15rem" }}>{s.title}</h2>
              {s.priceFrom && (
                <p className="text-muted" style={{ margin: "0 0 0.5rem" }}>
                  À partir de {s.priceFrom}
                </p>
              )}
              <p style={{ margin: 0 }}>{s.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
