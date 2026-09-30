import { Link } from "react-router";

export const meta = () => [{ title: "Espace client — Sites Artisans" }];

export default function EspaceClient() {
  return (
    <section className="section">
      <div className="container">
        <h1>Espace client (à venir)</h1>
        <p className="lead">
          Un portail simple pour suivre votre site, vos documents et vos factures — sans
          interface compliquée.
        </p>
        <div className="grid grid-2" style={{ marginTop: "2rem" }}>
          <div>
            <h2>Ce que vous y retrouverez</h2>
            <ul>
              <li>Statut de votre projet et prochaines étapes</li>
              <li>Documents utiles (contrat, captures, consignes photos)</li>
              <li>Factures émises via Indy, déposées manuellement pour consultation</li>
              <li>Demandes de modification de texte ou de photo</li>
            </ul>
            <p className="text-muted">
              <strong>Disponible au lancement</strong> (1<sup>er</sup> janvier 2027). En attendant,
              contactez-moi directement.
            </p>
            <Link to="/contact" className="btn btn-primary">
              Me contacter
            </Link>
          </div>
          <div className="card">
            <h3>Vue d’ensemble (schéma)</h3>
            <pre
              style={{
                fontSize: "0.8125rem",
                lineHeight: 1.5,
                overflow: "auto",
                margin: 0,
                background: "var(--surface)",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
{`┌─────────────────────────────┐
│  Tableau de bord            │
│  · Avancement du site       │
│  · Messages                 │
├─────────────────────────────┤
│  Documents & factures       │
│  · PDF Indy (upload manuel) │
├─────────────────────────────┤
│  Demandes                   │
│  · Texte / photos / horaires│
└─────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
