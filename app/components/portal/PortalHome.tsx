import { Link } from "react-router";

export function PortalLanding() {
  return (
    <section className="section">
      <div className="container">
        <h1>Espace client</h1>
        <p className="lead">
          Suivez l’avancement de votre site, consultez vos documents et déposez une demande de
          modification — sans interface compliquée.
        </p>
        <div className="hero-actions">
          <Link to="/espace-client/connexion" className="btn btn-primary">
            Se connecter
          </Link>
          <Link to="/contact" className="btn btn-ghost">
            Demander un accès
          </Link>
        </div>
        <p className="text-muted" style={{ marginTop: "1.5rem", maxWidth: "52ch" }}>
          Les factures sont déposées manuellement ici. L’espace sera pleinement actif au lancement
          du 1<sup>er</sup> janvier 2027.
        </p>
      </div>
    </section>
  );
}

export function PortalSetupNeeded() {
  const isDev = import.meta.env.DEV;

  return (
    <section className="section">
      <div className="container">
        <h1>Espace client</h1>
        <p className="lead">
          L’espace client sera disponible au lancement de l’activité (1<sup>er</sup> janvier 2027).
        </p>
        <p className="text-muted" style={{ maxWidth: "52ch" }}>
          En attendant, vous pouvez découvrir les offres, personnaliser un aperçu de site et nous
          écrire — nous vous répondons sous 24 à 48 h.
        </p>
        <div className="hero-actions" style={{ marginTop: "1.25rem" }}>
          <Link to="/configurateur" className="btn btn-primary">
            Personnaliser mon site
          </Link>
          <Link to="/contact" className="btn btn-ghost">
            Nous contacter
          </Link>
        </div>
        {isDev ? (
          <aside
            className="text-muted"
            style={{ marginTop: "2rem", fontSize: "0.875rem", maxWidth: "60ch" }}
          >
            <p>
              <strong>Dev uniquement :</strong> connectez Supabase pour activer la connexion
              (copiez <code>.env.example</code> → <code>.env</code>, renseignez{" "}
              <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code>, appliquez les
              migrations, puis redémarrez <code>npm run dev</code>).
            </p>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
