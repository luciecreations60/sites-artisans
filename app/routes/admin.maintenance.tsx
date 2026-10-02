import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MaintenanceCard } from "~/components/portal/MaintenanceCard";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { getSupabase } from "~/lib/supabase";
import type { MaintenanceQuota, Project } from "~/lib/supabase.types";

export const meta = () => [{ title: "Maintenance — Administration" }];

type Row = MaintenanceQuota & { project?: Project };

export default function AdminMaintenance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [q, p] = await Promise.all([
        sb.from("maintenance_quotas").select("*"),
        sb.from("projects").select("*"),
      ]);
      if (!active) return;
      if (q.error) {
        setError(q.error.message);
        setLoading(false);
        return;
      }
      const projects = (p.data as Project[]) ?? [];
      const map = new Map(projects.map((x) => [x.id, x]));
      setRows(
        ((q.data as MaintenanceQuota[]) ?? []).map((quota) => ({
          ...quota,
          project: map.get(quota.project_id),
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Maintenance</h1>
        <p className="text-muted">
          Quotas mensuels par projet. Prêt pour un futur lien abonnement (GoCardless).
        </p>
      </header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && rows.length === 0 && (
        <p className="text-muted">Aucun quota défini. Ouvrez une fiche projet pour en créer un.</p>
      )}

      <div className="admin-maint-grid">
        {rows.map((row) => (
          <article key={row.project_id} className="admin-maint-card">
            <h2>
              <Link to={`/admin/projets/${row.project_id}`}>
                {row.project?.title ?? "Projet"}
              </Link>
            </h2>
            <MaintenanceCard
              hoursIncluded={Number(row.hours_included)}
              hoursUsed={Number(row.hours_used)}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
