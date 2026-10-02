import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { formatDateFr, offerLabel } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  PROJECT_STATUS_LABELS,
  type OfferTier,
  type Profile,
  type Project,
  type ProjectStatus,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Projets — Administration" }];

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];
const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

export default function AdminProjets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const status = (searchParams.get("status") as ProjectStatus | null) || "";
  const tier = (searchParams.get("tier") as OfferTier | null) || "";
  const clientId = searchParams.get("client") || "";

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [p, pr] = await Promise.all([
        sb.from("projects").select("*").order("updated_at", { ascending: false }),
        sb.from("profiles").select("*").eq("role", "client"),
      ]);
      if (!active) return;
      if (p.error || pr.error) {
        setError(p.error?.message || pr.error?.message || "Erreur");
      } else {
        setProjects((p.data as Project[]) ?? []);
        setProfiles((pr.data as Profile[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (status && p.status !== status) return false;
      if (tier && p.offer_tier !== tier) return false;
      if (clientId && p.client_id !== clientId) return false;
      if (!q) return true;
      const client = profileMap.get(p.client_id);
      const blob = [p.title, p.domain, client?.full_name, client?.company_name, client?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [projects, query, status, tier, clientId, profileMap]);

  function patchParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Projets</h1>
        <p className="text-muted">Tous les dossiers clients.</p>
      </header>

      <div className="admin-filters">
        <label className="admin-search">
          Recherche
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Projet, client, domaine…"
          />
        </label>
        <label>
          Statut
          <select value={status} onChange={(e) => patchParam("status", e.target.value)}>
            <option value="">Tous</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {PROJECT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Formule
          <select value={tier} onChange={(e) => patchParam("tier", e.target.value)}>
            <option value="">Toutes</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {offerLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Client
          <select value={clientId} onChange={(e) => patchParam("client", e.target.value)}>
            <option value="">Tous</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name || p.full_name || p.email || p.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && filtered.length === 0 && (
        <p className="text-muted">Aucun projet ne correspond.</p>
      )}

      <div className="portal-project-list">
        {filtered.map((p) => {
          const client = profileMap.get(p.client_id);
          return (
            <Link key={p.id} to={`/admin/projets/${p.id}`} className="portal-project-card">
              <h2>{p.title}</h2>
              <p className="text-muted">
                {client?.company_name || client?.full_name || "Client"}
                {" · "}
                {offerLabel(p.offer_tier)}
                {" · "}
                {PROJECT_STATUS_LABELS[p.status]}
              </p>
              <p className="portal-project-card__hint">
                Maj {formatDateFr(p.updated_at)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
