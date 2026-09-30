import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "~/lib/auth";
import { getSupabase } from "~/lib/supabase";
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "~/lib/supabase.types";

function statusLabel(status: ProjectStatus) {
  return PROJECT_STATUS_LABELS[status] ?? status;
}

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
          Les factures Indy sont déposées manuellement ici (pas d’API Indy). L’espace sera pleinement
          actif au lancement du 1<sup>er</sup> janvier 2027.
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
            Exécutez le SQL de <code>supabase/schema.sql</code> dans le SQL Editor Supabase
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

export function ClientDashboard() {
  const { profile, user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb || !user) return;
    let active = true;
    (async () => {
      const { data, error: err } = await sb
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (!active) return;
      if (err) setError(err.message);
      else setProjects((data as Project[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <section className="section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1>Bonjour{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
            <p className="text-muted">
              {profile?.company_name || user?.email}
              {profile?.role === "admin" ? " · Admin" : ""}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Déconnexion
          </button>
        </div>

        {loading && <p className="text-muted">Chargement de vos projets…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && projects.length === 0 && (
          <p className="text-muted">
            Aucun projet pour le moment. Dès qu’un site est ouvert pour vous, il apparaîtra ici.
          </p>
        )}

        <div className="portal-project-list">
          {projects.map((p) => (
            <Link key={p.id} to={`/espace-client/projet/${p.id}`} className="portal-project-card">
              <h2>{p.title}</h2>
              <p className="text-muted">
                {statusLabel(p.status)}
                {p.offer_tier ? ` · ${p.offer_tier}` : ""}
                {p.domain ? ` · ${p.domain}` : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
