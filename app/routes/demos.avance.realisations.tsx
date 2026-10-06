import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";

export default function DemoAvanceRealisations() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const allTags = useMemo(() => {
    const set = new Set<string>();
    trade.projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [trade.projects]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = activeTag
    ? trade.projects.filter((p) => p.tags.includes(activeTag))
    : trade.projects;

  return (
    <main className="section">
      <div className="container">
        <h1>Réalisations</h1>
        <p className="text-muted">
          {trade.projects.length} chantiers présentés — les pastilles filtrent par thème (ce ne sont pas des photos
          supplémentaires).
        </p>
        <div style={{ margin: "1rem 0" }}>
          <button
            type="button"
            className={`tag${activeTag === null ? " is-active" : ""}`}
            onClick={() => setActiveTag(null)}
          >
            Tout
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag${activeTag === tag ? " is-active" : ""}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="grid grid-3">
          {filtered.map((p) => (
            <article key={p.id}>
              <img
                src={p.image.src}
                alt={p.image.alt}
                style={{ borderRadius: "var(--radius)", aspectRatio: "4/3", objectFit: "cover", width: "100%" }}
              />
              <h2 style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>{p.title}</h2>
              <p className="text-muted" style={{ margin: 0, fontSize: "0.9375rem" }}>
                {p.location} — {p.summary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
