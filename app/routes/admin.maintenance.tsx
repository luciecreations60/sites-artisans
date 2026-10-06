import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { MaintenanceCard } from "~/components/portal/MaintenanceCard";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { getSupabase } from "~/lib/supabase";
import type { MaintenanceQuota, Project } from "~/lib/supabase.types";

export const meta = () => [{ title: "Maintenance — Administration" }];

type Row = MaintenanceQuota & { project?: Project };

export default function AdminMaintenance() {
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function reload() {
    const sb = getSupabase();
    if (!sb) return;
    const [q, p] = await Promise.all([
      sb.from("maintenance_quotas").select("*"),
      sb.from("projects").select("*").order("title"),
    ]);
    if (q.error) {
      setError(q.error.message);
      setLoading(false);
      return;
    }
    const projectList = (p.data as Project[]) ?? [];
    setProjects(projectList);
    const map = new Map(projectList.map((x) => [x.id, x]));
    setRows(
      ((q.data as MaintenanceQuota[]) ?? []).map((quota) => ({
        ...quota,
        project: map.get(quota.project_id),
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function saveQuota(projectId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    setSavingId(projectId);
    setError(null);
    setOk(null);
    const payload = {
      project_id: projectId,
      hours_included: Number(fd.get("hours_included") || 1),
      hours_used: Number(fd.get("hours_used") || 0),
      period_start: String(
        fd.get("period_start") || new Date().toISOString().slice(0, 10),
      ),
    };
    const { error: err } = await sb.from("maintenance_quotas").upsert(payload);
    setSavingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setOk("Quota enregistré.");
    await reload();
  }

  const projectsWithoutQuota = projects.filter(
    (p) => !rows.some((r) => r.project_id === p.id),
  );

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Maintenance</h1>
        <p className="text-muted">
          Quotas mensuels par projet. Modifiables ici ou depuis la fiche projet.
        </p>
      </header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-muted">Aucun quota défini pour l’instant.</p>
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
            <form
              className="stack-form admin-maint-form"
              onSubmit={(e) => void saveQuota(row.project_id, e)}
            >
              <label>
                Heures incluses
                <input
                  name="hours_included"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={row.hours_included}
                  key={`inc-${row.project_id}-${row.hours_included}`}
                />
              </label>
              <label>
                Heures utilisées
                <input
                  name="hours_used"
                  type="number"
                  step="0.5"
                  min="0"
                  defaultValue={row.hours_used}
                  key={`used-${row.project_id}-${row.hours_used}`}
                />
              </label>
              <label>
                Début de période
                <input
                  name="period_start"
                  type="date"
                  defaultValue={row.period_start}
                  key={`start-${row.project_id}-${row.period_start}`}
                />
              </label>
              <button
                type="submit"
                className="btn btn-ghost"
                disabled={savingId === row.project_id}
              >
                {savingId === row.project_id ? "Enregistrement…" : "Enregistrer"}
              </button>
            </form>
          </article>
        ))}
      </div>

      {projectsWithoutQuota.length > 0 && (
        <section className="portal-section">
          <h2>Créer un quota</h2>
          <form
            className="stack-form admin-upload-form"
            onSubmit={(e) => {
              const fd = new FormData(e.currentTarget);
              const pid = String(fd.get("project_id") || "");
              if (!pid) return;
              void saveQuota(pid, e);
            }}
          >
            <label>
              Projet
              <select name="project_id" required defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {projectsWithoutQuota.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Heures incluses
              <input name="hours_included" type="number" step="0.5" min="0" defaultValue={1} />
            </label>
            <label>
              Heures utilisées
              <input name="hours_used" type="number" step="0.5" min="0" defaultValue={0} />
            </label>
            <label>
              Début de période
              <input
                name="period_start"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Créer le quota
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
