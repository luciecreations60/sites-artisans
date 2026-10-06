import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { ChangeRequestsList } from "~/components/portal/ChangeRequestsList";
import { ChecklistPanel } from "~/components/portal/ChecklistPanel";
import { MaintenanceCard } from "~/components/portal/MaintenanceCard";
import { ErrorState, LoadingState, PortalSection } from "~/components/portal/PortalUi";
import { ProjectTimeline } from "~/components/portal/ProjectTimeline";
import { useAuth } from "~/lib/auth";
import { formatDateFr, offerLabel } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  DOCUMENT_KIND_LABELS,
  PROJECT_STATUS_LABELS,
  type ChangeRequest,
  type ChecklistItem,
  type DocumentKind,
  type DocumentRow,
  type MaintenanceQuota,
  type OfferTier,
  type Profile,
  type Project,
  type ProjectEvent,
  type ProjectStatus,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Fiche projet — Administration" }];

export default function AdminProjetDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Profile | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [quota, setQuota] = useState<MaintenanceQuota | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<string | null>(null);

  // Event form
  const [evLabel, setEvLabel] = useState("");
  const [evDetail, setEvDetail] = useState("");
  const [evVisible, setEvVisible] = useState(true);

  // Doc form
  const [docTitle, setDocTitle] = useState("");
  const [docKind, setDocKind] = useState<DocumentKind>("facture");
  const [docFile, setDocFile] = useState<File | null>(null);

  async function reload() {
    if (!projectId) return;
    const sb = getSupabase();
    if (!sb) return;
    const [p, e, d, c, r, q] = await Promise.all([
      sb.from("projects").select("*").eq("id", projectId).maybeSingle(),
      sb.from("project_events").select("*").eq("project_id", projectId).order("created_at"),
      sb.from("documents").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      sb.from("checklist_items").select("*").eq("project_id", projectId).order("sort_order"),
      sb.from("change_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      sb.from("maintenance_quotas").select("*").eq("project_id", projectId).maybeSingle(),
    ]);
    if (p.error) setError(p.error.message);
    const proj = (p.data as Project | null) ?? null;
    setProject(proj);
    setEvents((e.data as ProjectEvent[]) ?? []);
    setDocs((d.data as DocumentRow[]) ?? []);
    setChecklist((c.data as ChecklistItem[]) ?? []);
    setRequests((r.data as ChangeRequest[]) ?? []);
    setQuota((q.data as MaintenanceQuota | null) ?? null);
    if (proj) {
      const { data } = await sb.from("profiles").select("*").eq("id", proj.client_id).maybeSingle();
      setClient((data as Profile | null) ?? null);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function saveProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !project) return;
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    setOk(null);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      status: String(fd.get("status")) as ProjectStatus,
      offer_tier: (String(fd.get("offer_tier") || "") || null) as OfferTier | null,
      domain: String(fd.get("domain") || "").trim() || null,
      target_date: String(fd.get("target_date") || "") || null,
      notes: String(fd.get("notes") || "").trim() || null,
    };
    const { error: err } = await sb.from("projects").update(payload).eq("id", projectId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOk("Projet enregistré.");
    await reload();
  }

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !user) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.from("project_events").insert({
      project_id: projectId,
      label: evLabel.trim(),
      detail: evDetail.trim() || null,
      created_by: user.id,
      visible_to_client: evVisible,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setEvLabel("");
    setEvDetail("");
    setEvVisible(true);
    setOk("Événement ajouté.");
    await reload();
  }

  async function toggleChecklist(item: ChecklistItem, done: boolean) {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.from("checklist_items").update({ done }).eq("id", item.id);
    if (err) setError(err.message);
    else await reload();
  }

  async function addChecklist(label: string) {
    if (!projectId) return;
    const sb = getSupabase();
    if (!sb) return;
    const maxOrder = checklist.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const { error: err } = await sb.from("checklist_items").insert({
      project_id: projectId,
      label,
      sort_order: maxOrder + 1,
    });
    if (err) setError(err.message);
    else await reload();
  }

  async function updateRequestStatus(req: ChangeRequest, status: ChangeRequest["status"]) {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.from("change_requests").update({ status }).eq("id", req.id);
    if (err) setError(err.message);
    else await reload();
  }

  async function uploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !user || !docFile) return;
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    setError(null);
    const safeName = docFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${projectId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await sb.storage.from("project-docs").upload(path, docFile, {
      upsert: false,
    });
    if (upErr) {
      setSaving(false);
      setError(upErr.message);
      return;
    }
    const { error: insErr } = await sb.from("documents").insert({
      project_id: projectId,
      kind: docKind,
      title: docTitle.trim() || docFile.name,
      storage_path: path,
      uploaded_by: user.id,
    });
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setDocTitle("");
    setDocFile(null);
    setOk("Document ajouté.");
    await reload();
  }

  async function deleteDocument(doc: DocumentRow) {
    if (!confirm(`Supprimer « ${doc.title} » ?`)) return;
    const sb = getSupabase();
    if (!sb) return;
    await sb.storage.from("project-docs").remove([doc.storage_path]);
    const { error: err } = await sb.from("documents").delete().eq("id", doc.id);
    if (err) setError(err.message);
    else await reload();
  }

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

  async function saveQuota(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId) return;
    const sb = getSupabase();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const payload = {
      project_id: projectId,
      hours_included: Number(fd.get("hours_included") || 1),
      hours_used: Number(fd.get("hours_used") || 0),
      period_start: String(fd.get("period_start") || new Date().toISOString().slice(0, 10)),
    };
    const { error: err } = await sb.from("maintenance_quotas").upsert(payload);
    if (err) setError(err.message);
    else {
      setOk("Quota mis à jour.");
      await reload();
    }
  }

  if (!project) {
    return (
      <div className="admin-page">
        {error ? <ErrorState message={error} /> : <LoadingState />}
        <p>
          <Link to="/admin/projets">← Projets</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <p>
        <Link to="/admin/projets">← Projets</Link>
      </p>
      <header className="admin-page__header">
        <h1>{project.title}</h1>
        <p className="text-muted">
          {client?.company_name || client?.full_name || "Client"}
          {client?.email ? ` · ${client.email}` : ""}
        </p>
      </header>

      {(project.source_prospect_id || project.source_demo_id) && (
        <div className="crm-source-links">
          <strong>Origine CRM</strong>
          <ul>
            {project.source_prospect_id && (
              <li>
                <Link to={`/admin/prospects/${project.source_prospect_id}`}>
                  Prospect source
                </Link>
              </li>
            )}
            {project.source_demo_id && project.source_prospect_id && (
              <li>
                <Link to={`/admin/prospects/${project.source_prospect_id}#demos`}>
                  Démo source
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}

      <PortalSection title="Résumé">
        <form className="stack-form admin-project-form" onSubmit={saveProject}>
          <label>
            Nom du projet
            <input name="title" defaultValue={project.title} required />
          </label>
          <div className="admin-form-row">
            <label>
              Statut
              <select name="status" defaultValue={project.status}>
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Formule
              <select name="offer_tier" defaultValue={project.offer_tier ?? ""}>
                <option value="">—</option>
                <option value="essentiel">Essentiel</option>
                <option value="avance">Avancé</option>
                <option value="pro">Pro</option>
              </select>
            </label>
          </div>
          <div className="admin-form-row">
            <label>
              URL / domaine
              <input name="domain" defaultValue={project.domain ?? ""} placeholder="exemple.fr" />
            </label>
            <label>
              Date cible
              <input name="target_date" type="date" defaultValue={project.target_date ?? ""} />
            </label>
          </div>
          <label>
            Notes internes
            <textarea name="notes" rows={3} defaultValue={project.notes ?? ""} />
          </label>
          <p className="text-muted" style={{ margin: 0 }}>
            Créé le {formatDateFr(project.created_at)} · Maj {formatDateFr(project.updated_at)}
          </p>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </PortalSection>

      <PortalSection title="Avancement">
        <ProjectTimeline status={project.status} events={events} />
        <h3 className="portal-subhead">Ajouter un événement</h3>
        <form className="stack-form" onSubmit={addEvent}>
          <label>
            Titre
            <input required value={evLabel} onChange={(e) => setEvLabel(e.target.value)} />
          </label>
          <label>
            Détail
            <textarea rows={2} value={evDetail} onChange={(e) => setEvDetail(e.target.value)} />
          </label>
          <label className="portal-check">
            <input
              type="checkbox"
              checked={evVisible}
              onChange={(e) => setEvVisible(e.target.checked)}
            />
            Visible par le client
          </label>
          <button type="submit" className="btn btn-ghost">
            Ajouter à la timeline
          </button>
        </form>
      </PortalSection>

      <PortalSection title="Checklist">
        <ChecklistPanel
          items={checklist}
          onToggle={toggleChecklist}
          onAdd={addChecklist}
        />
      </PortalSection>

      <PortalSection title="Documents">
        <ul className="portal-doc-list">
          {docs.map((doc) => (
            <li key={doc.id}>
              <button type="button" className="linkish" onClick={() => void openDocument(doc)}>
                {DOCUMENT_KIND_LABELS[doc.kind]} — {doc.title}
              </button>
              <span className="text-muted">{formatDateFr(doc.created_at)}</span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void deleteDocument(doc)}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        {docs.length === 0 && <p className="text-muted">Aucun document.</p>}
        <h3 className="portal-subhead">Ajouter un document</h3>
        <form className="stack-form" onSubmit={uploadDocument}>
          <label>
            Titre
            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
          </label>
          <label>
            Type
            <select
              value={docKind}
              onChange={(e) => setDocKind(e.target.value as DocumentKind)}
            >
              {(Object.keys(DOCUMENT_KIND_LABELS) as DocumentKind[]).map((k) => (
                <option key={k} value={k}>
                  {DOCUMENT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fichier
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={saving || !docFile}>
            Déposer
          </button>
        </form>
      </PortalSection>

      <PortalSection title="Demandes">
        <ChangeRequestsList requests={requests} onStatusChange={updateRequestStatus} />
      </PortalSection>

      <PortalSection title="Maintenance">
        {quota ? (
          <MaintenanceCard
            hoursIncluded={Number(quota.hours_included)}
            hoursUsed={Number(quota.hours_used)}
          />
        ) : (
          <p className="text-muted">Aucun quota défini.</p>
        )}
        <form className="stack-form admin-form-row" onSubmit={saveQuota} style={{ marginTop: "1rem" }}>
          <label>
            Heures incluses
            <input
              name="hours_included"
              type="number"
              step="0.5"
              min="0"
              defaultValue={quota?.hours_included ?? 1}
            />
          </label>
          <label>
            Heures utilisées
            <input
              name="hours_used"
              type="number"
              step="0.5"
              min="0"
              defaultValue={quota?.hours_used ?? 0}
            />
          </label>
          <label>
            Début de période
            <input
              name="period_start"
              type="date"
              defaultValue={
                quota?.period_start ?? new Date().toISOString().slice(0, 10)
              }
            />
          </label>
          <button type="submit" className="btn btn-ghost">
            Enregistrer le quota
          </button>
        </form>
      </PortalSection>

      <p className="text-muted">
        Formule : {offerLabel(project.offer_tier)} · Client ID : {project.client_id.slice(0, 8)}…
      </p>
    </div>
  );
}
