import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { useAuth } from "~/lib/auth";
import { formatDateFr } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  DOCUMENT_KIND_LABELS,
  type DocumentKind,
  type DocumentRow,
  type Project,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Documents — Administration" }];

type Row = DocumentRow & { project?: Project };

export default function AdminDocuments() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [projectId, setProjectId] = useState("");
  const [docKind, setDocKind] = useState<DocumentKind>("facture");
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);

  async function reload() {
    const sb = getSupabase();
    if (!sb) return;
    const [d, p] = await Promise.all([
      sb.from("documents").select("*").order("created_at", { ascending: false }),
      sb.from("projects").select("*").order("title"),
    ]);
    if (d.error) {
      setError(d.error.message);
      setLoading(false);
      return;
    }
    const projectList = (p.data as Project[]) ?? [];
    setProjects(projectList);
    const map = new Map(projectList.map((x) => [x.id, x]));
    setRows(
      ((d.data as DocumentRow[]) ?? []).map((doc) => ({
        ...doc,
        project: map.get(doc.project_id),
      })),
    );
    setLoading(false);
  }

  useEffect(() => {
    void reload();
  }, []);

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

  async function uploadDocument(e: FormEvent) {
    e.preventDefault();
    if (!user || !docFile || !projectId) return;
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const safeName = docFile.name.replace(/[^\w.\-]+/g, "_");
    const path = `${projectId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await sb.storage.from("project-docs").upload(path, docFile, {
      upsert: false,
    });
    if (upErr) {
      setBusy(false);
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
    setBusy(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setDocTitle("");
    setDocFile(null);
    setOk("Document ajouté. Visible côté client sur ce projet.");
    setShowForm(false);
    await reload();
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__header-row">
          <div>
            <h1>Documents</h1>
            <p className="text-muted">
              Fichiers déposés (factures Indy manuelles, contrats, briefs…).
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Fermer" : "+ Ajouter un document"}
          </button>
        </div>
      </header>

      {showForm && (
        <form className="stack-form admin-upload-form" onSubmit={uploadDocument}>
          <label>
            Projet
            <select
              required
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Choisir un projet…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
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
            Titre
            <input
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Ex. Facture mars 2026"
            />
          </label>
          <label>
            Fichier
            <input
              type="file"
              required
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={busy || !docFile}>
            {busy ? "Dépôt…" : "Déposer le document"}
          </button>
        </form>
      )}

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}
      {!loading && rows.length === 0 && (
        <p className="text-muted">Aucun document.</p>
      )}

      <ul className="portal-doc-list admin-doc-list">
        {rows.map((doc) => (
          <li key={doc.id}>
            <button type="button" className="linkish" onClick={() => void openDocument(doc)}>
              {DOCUMENT_KIND_LABELS[doc.kind]} — {doc.title}
            </button>
            <span className="text-muted">
              <Link to={`/admin/projets/${doc.project_id}`}>
                {doc.project?.title ?? "Projet"}
              </Link>
              {" · "}
              {formatDateFr(doc.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
