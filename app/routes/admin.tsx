import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { useAuth } from "~/lib/auth";
import {
  formatDateFr,
  greetTitle,
  isOpenChangeStatus,
  offerLabel,
} from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  PROJECT_STATUS_LABELS,
  type ChangeRequest,
  type ChecklistItem,
  type Profile,
  type Project,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Administration — Sites Artisans" }];

type TodoItem = {
  id: string;
  kind: string;
  title: string;
  meta: string;
  href: string;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<(ChangeRequest & { project?: Project })[]>([]);
  const [checklist, setChecklist] = useState<(ChecklistItem & { project_id: string })[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [p, pr, r, c] = await Promise.all([
        sb.from("projects").select("*").order("updated_at", { ascending: false }),
        sb.from("profiles").select("*").eq("role", "client").order("full_name"),
        sb.from("change_requests").select("*").order("created_at", { ascending: false }).limit(40),
        sb.from("checklist_items").select("*").eq("done", false).order("sort_order").limit(40),
      ]);
      if (!active) return;
      if (p.error || pr.error || r.error || c.error) {
        setError(p.error?.message || pr.error?.message || r.error?.message || c.error?.message || "Erreur");
      }
      const projectList = (p.data as Project[]) ?? [];
      setProjects(projectList);
      setProfiles((pr.data as Profile[]) ?? []);
      const reqs = (r.data as ChangeRequest[]) ?? [];
      setRequests(
        reqs.map((req) => ({
          ...req,
          project: projectList.find((x) => x.id === req.project_id),
        })),
      );
      setChecklist((c.data as ChecklistItem[]) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status !== "en_ligne" && p.status !== "maintenance");
    const waiting = projects.filter((p) => p.status === "brief" || p.status === "recette");
    const openReqs = requests.filter((r) => isOpenChangeStatus(r.status));
    const pendingItems = checklist.length;
    const maint = projects.filter((p) => p.status === "maintenance");
    return {
      active: active.length,
      waiting: waiting.length,
      openReqs: openReqs.length,
      pendingItems,
      maint: maint.length,
    };
  }, [projects, requests, checklist]);

  const todos = useMemo(() => {
    const items: TodoItem[] = [];
    for (const req of requests.filter((r) => isOpenChangeStatus(r.status)).slice(0, 8)) {
      items.push({
        id: `req-${req.id}`,
        kind: "Demande",
        title: req.title,
        meta: `${req.project?.title ?? "Projet"} · ${formatDateFr(req.created_at)}`,
        href: `/admin/projets/${req.project_id}`,
      });
    }
    for (const item of checklist.slice(0, 8)) {
      const proj = projects.find((p) => p.id === item.project_id);
      items.push({
        id: `chk-${item.id}`,
        kind: "Élément attendu",
        title: item.label,
        meta: proj?.title ?? "Projet",
        href: `/admin/projets/${item.project_id}`,
      });
    }
    return items.slice(0, 12);
  }, [requests, checklist, projects]);

  const profileById = useMemo(() => {
    const map = new Map(profiles.map((p) => [p.id, p]));
    return map;
  }, [profiles]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>{greetTitle(profile)}</h1>
        <p className="text-muted">Vue d’ensemble de l’activité à traiter.</p>
      </header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <>
          <div className="admin-stats">
            <Stat label="Projets en cours" value={stats.active} />
            <Stat label="Projets en attente" value={stats.waiting} />
            <Stat label="Demandes ouvertes" value={stats.openReqs} />
            <Stat label="Éléments attendus" value={stats.pendingItems} />
            <Stat label="En maintenance" value={stats.maint} />
          </div>

          <section className="portal-section">
            <div className="portal-section__head">
              <h2>À traiter</h2>
              <Link to="/admin/demandes">Toutes les demandes</Link>
            </div>
            {todos.length === 0 ? (
              <p className="text-muted">Rien en attente pour le moment.</p>
            ) : (
              <ul className="admin-todo-list">
                {todos.map((t) => (
                  <li key={t.id}>
                    <Link to={t.href}>
                      <span className="admin-todo-list__kind">{t.kind}</span>
                      <strong>{t.title}</strong>
                      <span className="text-muted">{t.meta}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="portal-section">
            <div className="portal-section__head">
              <h2>Projets récents / actifs</h2>
              <Link to="/admin/projets">Tous les projets</Link>
            </div>
            <div className="portal-project-list">
              {projects.slice(0, 8).map((p) => {
                const client = profileById.get(p.client_id);
                return (
                  <Link
                    key={p.id}
                    to={`/admin/projets/${p.id}`}
                    className="portal-project-card"
                  >
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
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-stat">
      <p className="admin-stat__value">{value}</p>
      <p className="admin-stat__label">{label}</p>
    </div>
  );
}
