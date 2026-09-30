import { Link } from "react-router";
import { offerPlans } from "~/data/offers";

export const meta = () => [{ title: "Offres — Sites Artisans" }];

export default function Offres() {
  return (
    <section className="section">
      <div className="container">
        <h1>Nos offres</h1>
        <p className="lead">
          Tarifs indicatifs pour une micro-entreprise artisanale. Chaque projet est ajusté après
          un premier échange.
        </p>
        <div className="grid grid-3" style={{ marginTop: "2rem" }}>
          {offerPlans.map((plan) => (
            <article key={plan.tier} className="card">
              <h2>{plan.name}</h2>
              <p className="text-muted">{plan.tagline}</p>
              <p>
                <strong>Création : {plan.setup}</strong>
                <br />
                <span className="text-muted">Abonnement : {plan.monthly}</span>
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
        <p style={{ marginTop: "2rem" }}>
          <Link to="/comparatif">Comparer les formules en détail →</Link>
        </p>
      </div>
    </section>
  );
}
