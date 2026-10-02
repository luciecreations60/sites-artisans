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
  return (
    <section className="section">
      <div className="container">
        <h1>Espace client</h1>
        <p className="lead">Supabase n’est pas encore configuré sur cet environnement.</p>
        <ol>
          <li>
            Copiez <code>.env.example</code> vers <code>.env</code>
          </li>
          <li>
            Renseignez <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code>
          </li>
          <li>
            Exécutez <code>supabase/schema.sql</code> puis la migration{" "}
            <code>supabase/migrations/20261002_portal_admin_harden.sql</code>
          </li>
          <li>Redémarrez <code>npm run dev</code></li>
        </ol>
        <Link to="/contact" className="btn btn-ghost">
          Contacter
        </Link>
      </div>
    </section>
  );
}
