import { useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { BeforeAfter, BeforeAfterPlaceholder } from "~/components/BeforeAfter";
import { DemoModulesNote } from "~/components/DemoModulesNote";
import type { TradeData } from "~/data/types";
import { useDemoBasePath, useDemoSearch } from "~/lib/useDemoPaths";
import { useDemoModules } from "~/lib/templates/useDemoModules";

export default function DemoProRealisations() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();
  const modules = useDemoModules("pro");
  const baProject = trade.projects.find((p) => p.before && p.after);

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
        <h1>Portfolio</h1>
        <p className="text-muted">
          Galerie premium — exemples illustratifs. Chaque fiche détaillée est accessible en formule
          Pro.
        </p>

        {modules.gallery_before_after ? (
          <section className="r-ba" style={{ paddingTop: "1.5rem" }}>
            <p className="r-label">Avant / après</p>
            <h2 style={{ fontSize: "1.35rem" }}>
              {baProject?.title ?? "Module prêt à personnaliser"}
            </h2>
            {baProject?.before && baProject.after ? (
              <BeforeAfter before={baProject.before} after={baProject.after} illustrative />
            ) : (
              <BeforeAfterPlaceholder />
            )}
          </section>
        ) : null}

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

        <div className="grid grid-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`${basePath}/pro/realisations/${p.id}${q}`}
              className="card card--interactive"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <img
                src={p.image.src}
                alt={p.image.alt}
                loading="lazy"
                style={{
                  borderRadius: "8px",
                  aspectRatio: "16/10",
                  objectFit: "cover",
                  width: "100%",
                  marginBottom: "0.75rem",
                }}
                onError={(e) => {
                  e.currentTarget.style.visibility = "hidden";
                }}
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
