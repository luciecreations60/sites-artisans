import { Link } from "react-router";
import { offerPlans } from "~/data/offers";

export const meta = () => [
  { title: "Sites Artisans — Sites simples pour artisans" },
];

export default function Home() {
  return (
    <>
      <section className="marketing-hero">
        <div className="marketing-hero__bg" aria-hidden />
        <div className="container marketing-hero__content hero-fade">
          <h1 className="brand-hero">Sites Artisans</h1>
          <p className="lead">
            Des sites web simples pour les artisans qui travaillent sur le terrain — pour que vos
            clients vous trouvent, vous comprennent et vous contactent.
          </p>
          <div className="hero-actions">
            <Link to="/offres" className="btn btn-primary">
              Voir les offres
            </Link>
            <Link to="/demos" className="btn btn-ghost">
              Voir les démos
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Trois formules adaptées à votre activité</h2>
          <p className="text-muted" style={{ maxWidth: "48ch" }}>
            Du site vitrine en une page jusqu’à la version la plus complète avec devis et
            réalisations détaillées.
          </p>
          <div className="grid grid-3" style={{ marginTop: "1.5rem" }}>
            {offerPlans.map((plan) => (
              <article key={plan.tier}>
                <h3>{plan.name}</h3>
                <p className="text-muted">{plan.tagline}</p>
                <p>
                  <strong>À partir de {plan.priceFrom}</strong>
                  <br />
                  <span className="text-muted" style={{ fontSize: "0.9375rem" }}>
                    puis {plan.monthly}
                  </span>
                </p>
                <Link to={`/demos?offre=${plan.tier}`} className="btn btn-ghost">
                  Voir une démo
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <h2>Comment ça se passe</h2>
          <ol className="steps" style={{ maxWidth: "36rem", marginTop: "1.5rem" }}>
            <li>
              <strong>Échange téléphonique</strong> — Vous me décrivez votre métier, votre zone
              et ce que vos clients demandent le plus souvent.
            </li>
            <li>
              <strong>Maquette et contenu</strong> — Je prépare la structure et vous aide à
              choisir photos et textes (sans vous noyer).
            </li>
            <li>
              <strong>Mise en ligne</strong> — Nom de domaine, hébergement et formulaire de
              contact prêts à l’emploi.
            </li>
          </ol>
        </div>
      </section>
    </>
  );
}
