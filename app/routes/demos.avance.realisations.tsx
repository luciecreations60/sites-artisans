import { useMemo, useState } from "react";
import { useOutletContext } from "react-router";
import { DemoModulesNote } from "~/components/DemoModulesNote";
import type { TradeData } from "~/data/types";
import { demoCopy } from "~/lib/demoCopy";
import { useDemoModules } from "~/lib/templates/useDemoModules";

export default function DemoAvanceRealisations() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const copy = demoCopy(trade);
  const modules = useDemoModules("avance");
  const allTags = useMemo(() => {
    const set = new Set<string>();
    trade.projects.forEach((p) => p.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [trade.projects]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered =
    modules.gallery_filtered && activeTag
      ? trade.projects.filter((p) => p.tags.includes(activeTag))
      : trade.projects;

  return (
    <main className="section">
      <DemoModulesNote modules={modules} />
      <div className="container">
        <h1>{copy.galleryHeading}</h1>
        <p className="text-muted">
          Exemples illustratifs — {trade.projects.length} projets de démonstration. Les photos
          seront remplacées par celles du client en production.
        </p>
        {modules.gallery_filtered ? (
          <div style={{ margin: "1rem 0" }} role="group" aria-label="Filtrer par thème">
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
        ) : null}
        <div className="grid grid-3">
          {filtered.map((p) => (
            <article key={p.id}>
              <img
                src={p.image.src}
                alt={p.image.alt}
                loading="lazy"
                className="media-rounded"
                style={{ aspectRatio: "4/3", width: "100%" }}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
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
