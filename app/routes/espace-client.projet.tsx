import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "~/lib/auth";
import { getSupabase } from "~/lib/supabase";
import {
  DOCUMENT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
  type ChangeRequest,
  type ChecklistItem,
  type DocumentRow,
  type MaintenanceQuota,
  type Project,
  type ProjectEvent,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Projet — Espace client" }];

export default function EspaceClientProjet() {
  const { projectId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [quota, setQuota] = useState<MaintenanceQuota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);

  useEffect(() => {
    if (authLoading || !user || !projectId) return;
    const sb = getSupabase();
    if (!sb) return;
    let active = true;

    (async () => {
      const [p, e, d, c, r, q] = await Promise.all([
        sb.from("projects").select("*").eq("id", projectId).maybeSingle(),
        sb.from("project_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        sb.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        sb.from("checklist_items").select("*").eq("project_id", projectId).order("sort_order"),
        sb.from("change_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
        sb.from("maintenance_quotas").select("*").eq("project_id", projectId).maybeSingle(),
      ]);
      if (!active) return;
      if (p.error) setError(p.error.message);
      setProject((p.data as Project | null) ?? null);
      setEvents((e.data as ProjectEvent[]) ?? []);
      setDocs((d.data as DocumentRow[]) ?? []);
      setChecklist((c.data as ChecklistItem[]) ?? []);
      setRequests((r.data as ChangeRequest[]) ?? []);
      setQuota((q.data as MaintenanceQuota | null) ?? null);
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user, projectId]);

  const remainingHours = useMemo(() => {
    if (!quota) return null;
    return Math.max(0, Number(quota.hours_included) - Number(quota.hours_used));
  }, [quota]);

  async function openDocument(doc: DocumentRow) {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error: err } = await sb.storage
      .from("project-docs")
      .createSignedUrl(doc.storage_path, 120);
    if (err || !data?.signedUrl) {
      setError(err?.message ?? "Impossible d’ouvrir le document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function submitRequest(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !user) return;
    const sb = getSupabase();
    if (!sb) return;
    setSending(true);
    setSentOk(false);
    setError(null);
    const { error: err } = await sb.from("change_requests").insert({
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      created_by: user.id,
    });
    setSending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setTitle("");
    setDescription("");
    setSentOk(true);
    const { data } = await sb
      .from("change_requests")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    setRequests((data as ChangeRequest[]) ?? []);
  }

  if (authLoading) {
    return (
      <section className="section">
        <div className="container">
          <p className="text-muted">Chargement…</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="section">
        <div className="container">
          <p>
            <Link to="/espace-client/connexion">Connectez-vous</Link> pour voir ce projet.
          </p>
        </div>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="section">
        <div className="container">
          {error ? <p className="form-error">{error}</p> : <p className="text-muted">Projet introuvable.</p>}
          <Link to="/espace-client">Retour au tableau de bord</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container">
        <p>
          <Link to="/espace-client">← Mes projets</Link>
        </p>
        <h1>{project.title}</h1>
        <p className="text-muted">
          {PROJECT_STATUS_LABELS[project.status]}
          {project.domain ? ` · ${project.domain}` : ""}
        </p>
        {error && <p className="form-error">{error}</p>}

        <div className="portal-grid">
          <div>
            <h2>Avancement</h2>
            {events.length === 0 ? (
              <p className="text-muted">Aucune étape enregistrée pour l’instant.</p>
            ) : (
              <ol className="timeline">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.label}</strong>
                    {ev.detail ? <p className="text-muted">{ev.detail}</p> : null}
                    <time className="text-muted" dateTime={ev.created_at}>
                      {new Date(ev.created_at).toLocaleDateString("fr-FR")}
                    </time>
                  </li>
                ))}
              </ol>
            )}

            <h2>Checklist</h2>
            {checklist.length === 0 ? (
              <p className="text-muted">Rien à préparer de votre côté pour le moment.</p>
            ) : (
              <ul className="checklist">
                {checklist.map((item) => (
                  <li key={item.id} data-done={item.done ? "1" : "0"}>
                    {item.done ? "✓ " : "○ "}
                    {item.label}
                  </li>
                ))}
              </ul>
            )}

            {quota && (
              <>
                <h2>Maintenance</h2>
                <p>
                  {remainingHours} h restantes ce mois-ci ({quota.hours_used} / {quota.hours_included}{" "}
                  utilisées).
                </p>
              </>
            )}
          </div>

          <div>
            <h2>Documents</h2>
            <p className="text-muted" style={{ fontSize: "0.9375rem" }}>
              Factures Indy déposées manuellement.
            </p>
            {docs.length === 0 ? (
              <p className="text-muted">Aucun document pour l’instant.</p>
            ) : (
              <ul className="doc-list">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <button type="button" className="linkish" onClick={() => void openDocument(doc)}>
                      {DOCUMENT_KIND_LABELS[doc.kind]} — {doc.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <h2>Demande de modification</h2>
            <form className="stack-form" onSubmit={submitRequest}>
              <label>
                Titre
                <input required value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>
              <label>
                Détail
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={sending}>
                {sending ? "Envoi…" : "Envoyer"}
              </button>
              {sentOk && <p className="text-muted">Demande enregistrée.</p>}
            </form>

            {requests.length > 0 && (
              <ul className="request-list">
                {requests.map((req) => (
                  <li key={req.id}>
                    <strong>{req.title}</strong> · {req.status}
                    <p className="text-muted">{req.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
