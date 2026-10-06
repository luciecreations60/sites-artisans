import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { formatDateFr } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import type { Profile, Project } from "~/lib/supabase.types";

export const meta = () => [{ title: "Clients — Administration" }];

type ClientRow = Profile & {
  projectCount: number;
  lastActivity: string | null;
};

export default function AdminClients() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [pr, pj] = await Promise.all([
        sb.from("profiles").select("*").eq("role", "client").order("full_name"),
        sb.from("projects").select("id, client_id, updated_at"),
      ]);
      if (!active) return;
      if (pr.error || pj.error) {
        setError(pr.error?.message || pj.error?.message || "Erreur");
        setLoading(false);
        return;
      }
      const projects = (pj.data as Pick<Project, "id" | "client_id" | "updated_at">[]) ?? [];
      const clients = (pr.data as Profile[]) ?? [];
      setRows(
        clients.map((c) => {
          const cps = projects.filter((p) => p.client_id === c.id);
          const last = cps
            .map((p) => p.updated_at)
            .sort()
            .at(-1) ?? null;
          return {
            ...c,
            projectCount: cps.length,
            lastActivity: last,
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const blob = [r.full_name, r.company_name, r.email, r.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [rows, query]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Clients</h1>
        <p className="text-muted">Comptes ayant un accès espace client.</p>
      </header>

      <label className="admin-search">
        Recherche
        <input
          type="search"
          placeholder="Nom, entreprise, e-mail…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && filtered.length === 0 && (
        <p className="text-muted">Aucun client trouvé.</p>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Entreprise</th>
              <th>E-mail</th>
              <th>Téléphone</th>
              <th>Projets</th>
              <th>Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name || "—"}</td>
                <td>{c.company_name || "—"}</td>
                <td>{c.email || "—"}</td>
                <td>{c.phone || "—"}</td>
                <td>
                  <Link to={`/admin/projets?client=${c.id}`}>{c.projectCount}</Link>
                </td>
                <td>{formatDateFr(c.lastActivity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
