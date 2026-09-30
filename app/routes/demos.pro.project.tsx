import { Link, useOutletContext, useParams } from "react-router";
import { BeforeAfter } from "~/components/BeforeAfter";
import type { TradeData } from "~/data/types";

export default function DemoProProject() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const { projectId } = useParams();
  const project = trade.projects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <main className="section container">
        <h1>Projet introuvable</h1>
        <Link to={`/demos/${trade.slug}/pro/realisations`}>Retour au portfolio</Link>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container">
        <p>
          <Link to={`/demos/${trade.slug}/pro/realisations`}>← Réalisations</Link>
        </p>
        <h1>{project.title}</h1>
        <p className="text-muted">
          {project.location} · {project.tags.join(", ")}
        </p>
        {project.before && project.after ? (
          <BeforeAfter before={project.before} after={project.after} />
        ) : (
          <img
            src={project.image.src}
            alt={project.image.alt}
            style={{ borderRadius: "var(--radius)", width: "100%", maxHeight: "480px", objectFit: "cover" }}
          />
        )}
        <p style={{ marginTop: "1.5rem", maxWidth: "65ch" }}>{project.summary}</p>
        <Link to={`/demos/${trade.slug}/pro/devis`} className="btn btn-primary">
          Projet similaire ? Demander un devis
        </Link>
      </div>
    </main>
  );
}
