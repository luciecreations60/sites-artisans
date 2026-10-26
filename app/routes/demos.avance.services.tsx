import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { demoCopy } from "~/lib/demoCopy";

export default function DemoAvanceServices() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const copy = demoCopy(trade);

  return (
    <main className="section">
      <div className="container">
        <h1>Nos services</h1>
        <p className="text-muted">{copy.servicesLead(trade.defaultCity)}</p>
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
