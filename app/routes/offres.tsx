import { Link } from "react-router";
import {
  commercialNotes,
  formatSetupPrice,
  offerPlans,
} from "~/data/offers";

export const meta = () => [{ title: "Offres — Site AZ" }];

export default function Offres() {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Les formules</p>
        <h1>Trois offres, une même exigence.</h1>
        <p className="lead">
          Prix de création de référence pour les artisans et petites entreprises. Chaque projet
          est ajusté après un premier échange — sans abonnement mensuel obligatoire.
        </p>
        <div className="grid grid-3 offer-grid">
          {offerPlans.map((plan) => (
            <article
              key={plan.tier}
              className={`offer-card${plan.tier === "avance" ? " offer-card--featured" : ""}`}
            >
              {plan.tier === "avance" && <span className="offer-chip">Le plus choisi</span>}
              <h2 style={{ fontSize: "1.75rem" }}>{plan.name}</h2>
              <p className="text-muted" style={{ margin: 0 }}>
                {plan.tagline}
              </p>
              <p className="offer-price">
                <span className="offer-price__label">Création</span>
                {formatSetupPrice(plan.setupPrice)}
              </p>
              <ul>
                {plan.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <div className="hero-actions" style={{ marginTop: "auto" }}>
                <Link
                  to={`/configurateur?formule=${plan.tier}&parcours=formula`}
                  className="btn btn-primary"
                >
                  Personnaliser {plan.name}
                </Link>
                <Link to={`/demos?offre=${plan.tier}`} className="btn btn-ghost">
                  Essayer en démo
                </Link>
              </div>
            </article>
          ))}
        </div>

        <aside className="pricing-notes" aria-label="Précisions tarifaires">
          <h2 className="pricing-notes__title">Ce qui est inclus — et ce qui ne l’est pas</h2>
          <ul className="pricing-notes__list">
            <li>
              <strong>Création du site</strong> — {commercialNotes.setupOnly}
            </li>
            <li>
              <strong>Hébergement &amp; nom de domaine</strong> — {commercialNotes.hosting}
            </li>
            <li>
              <strong>Maintenance</strong> — {commercialNotes.maintenance}
            </li>
            <li>
              <strong>Outils externes</strong> — {commercialNotes.thirdParty}
            </li>
          </ul>
        </aside>

        <p style={{ marginTop: "2.5rem" }}>
          <Link to="/comparatif">Comparer les formules en détail →</Link>
        </p>
      </div>
    </section>
  );
}
