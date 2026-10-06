import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { changeStatusLabel, formatDateFr, isOpenChangeStatus } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import type { ChangeRequest, ChangeRequestStatus, Profile, Project } from "~/lib/supabase.types";

export const meta = () => [{ title: "Demandes — Administration" }];

type Row = ChangeRequest & {
  project?: Project;
  client?: Profile;
};

const STATUS_OPTIONS: { value: ChangeRequestStatus; label: string }[] = [
  { value: "ouvert", label: "Ouverte" },
  { value: "en_cours", label: "En cours" },
  { value: "besoin_info", label: "Besoin d’information" },
  { value: "termine", label: "Terminée" },
  { value: "refuse", label: "Refusée" },
];

export default function AdminDemandes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [r, p, pr] = await Promise.all([
        sb.from("change_requests").select("*").order("created_at", { ascending: false }),
        sb.from("projects").select("*"),
        sb.from("profiles").select("*").eq("role", "client"),
      ]);
      if (!active) return;
      if (r.error) {
        setError(r.error.message);
        setLoading(false);
        return;
      }
      const projects = (p.data as Project[]) ?? [];
      const profiles = (pr.data as Profile[]) ?? [];
      const projectMap = new Map(projects.map((x) => [x.id, x]));
      const profileMap = new Map(profiles.map((x) => [x.id, x]));
      setRows(
        ((r.data as ChangeRequest[]) ?? []).map((req) => {
          const project = projectMap.get(req.project_id);
          return {
            ...req,
            project,
            client: project ? profileMap.get(project.client_id) : undefined,
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => (onlyOpen ? rows.filter((r) => isOpenChangeStatus(r.status)) : rows),
    [rows, onlyOpen],
  );

  async function updateStatus(req: Row, status: ChangeRequestStatus) {
    if (req.status === status) return;
    const sb = getSupabase();
    if (!sb) return;
    setUpdatingId(req.id);
    setError(null);
    const { error: err } = await sb.from("change_requests").update({ status }).eq("id", req.id);
    setUpdatingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Demandes</h1>
        <p className="text-muted">Demandes de modification des clients.</p>
      </header>

      <label className="portal-check">
        <input
          type="checkbox"
          checked={onlyOpen}
          onChange={(e) => setOnlyOpen(e.target.checked)}
        />
        Afficher uniquement les demandes ouvertes
      </label>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && filtered.length === 0 && (
        <p className="text-muted">Aucune demande.</p>
      )}

      <ul className="portal-requests">
        {filtered.map((req) => (
          <li key={req.id} className="portal-request-card">
            <div className="portal-request-card__head">
              <h3>{req.title}</h3>
              <time dateTime={req.created_at}>{formatDateFr(req.created_at)}</time>
            </div>
            <p className="text-muted" style={{ margin: "0 0 0.5rem" }}>
              {req.client?.company_name || req.client?.full_name || "Client"}
              {" · "}
              <Link to={`/admin/projets/${req.project_id}`}>
                {req.project?.title ?? "Projet"}
              </Link>
            </p>
            <p className="portal-request-card__status">
              Statut : <strong>{changeStatusLabel(req.status)}</strong>
            </p>
            <blockquote className="portal-request-card__body">{req.description}</blockquote>
            <label className="portal-request-card__admin">
              Changer le statut
              <select
                value={req.status}
                disabled={updatingId === req.id}
                onChange={(e) =>
                  void updateStatus(req, e.target.value as ChangeRequestStatus)
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
