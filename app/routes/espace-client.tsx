import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth";
import {
  PortalLanding,
  PortalSetupNeeded,
} from "~/components/portal/PortalHome";
import { LoadingState } from "~/components/portal/PortalUi";
import { greetTitle, isAdminRole, offerLabel } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  PROJECT_STATUS_LABELS,
  type Project,
  type ProjectStatus,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Espace client — Sites Artisans" }];

export default function EspaceClient() {
  const { configured, loading, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && isAdminRole(profile?.role)) {
      navigate("/admin", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (!configured) return <PortalSetupNeeded />;
  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Chargement de votre session…" />
        </div>
      </section>
    );
  }
  if (!user) return <PortalLanding />;
  if (isAdminRole(profile?.role)) {
    return (
      <section className="section">
        <div className="container">
          <LoadingState label="Redirection vers l’administration…" />
        </div>
      </section>
    );
  }
  return <ClientHome />;
}

function ClientHome() {
  const { profile, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
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
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div className="portal-header">
          <div>
            <h1>{greetTitle(profile)}</h1>
            <p className="text-muted">
              {profile?.company_name || "Votre espace projet"}
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => void signOut()}>
            Déconnexion
          </button>
        </div>

        {loading && <LoadingState label="Chargement de vos projets…" />}
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
                {PROJECT_STATUS_LABELS[p.status as ProjectStatus] ?? p.status}
                {p.offer_tier ? ` · ${offerLabel(p.offer_tier)}` : ""}
              </p>
              <p className="portal-project-card__hint">Voir l’avancement →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
