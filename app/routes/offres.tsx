import { Link } from "react-router";
import { offerPlans } from "~/data/offers";

export const meta = () => [{ title: "Offres — Sites Artisans" }];

export default function Offres() {
  return (
    <section className="section">
      <div className="container">
        <p className="eyebrow">Les formules</p>
        <h1>Trois offres, une même exigence.</h1>
        <p className="lead">
          Tarifs indicatifs pour les artisans et petites entreprises. Chaque projet est ajusté
          après un premier échange.
        </p>
        <div className="grid grid-3" style={{ marginTop: "2.5rem" }}>
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
              <p className="offer-price">Création : {plan.setup}</p>
              <p className="text-muted" style={{ margin: 0 }}>
                Abonnement : {plan.monthly}
              </p>
              <ul>
                {plan.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <Link to="/demos" className="btn btn-primary">
                Essayer en démo
              </Link>
            </article>
          ))}
        </div>
        <p style={{ marginTop: "2.5rem" }}>
          <Link to="/comparatif">Comparer les formules en détail →</Link>
        </p>
      </div>
    </section>
  );
}
