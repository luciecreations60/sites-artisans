import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { formatDateFr } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import {
  DOCUMENT_KIND_LABELS,
  type DocumentRow,
  type Project,
} from "~/lib/supabase.types";

export const meta = () => [{ title: "Documents — Administration" }];

type Row = DocumentRow & { project?: Project };

export default function AdminDocuments() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    (async () => {
      const [d, p] = await Promise.all([
        sb.from("documents").select("*").order("created_at", { ascending: false }),
        sb.from("projects").select("*"),
      ]);
      if (!active) return;
      if (d.error) {
        setError(d.error.message);
        setLoading(false);
        return;
      }
      const projects = (p.data as Project[]) ?? [];
      const map = new Map(projects.map((x) => [x.id, x]));
      setRows(
        ((d.data as DocumentRow[]) ?? []).map((doc) => ({
          ...doc,
          project: map.get(doc.project_id),
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
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

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <h1>Documents</h1>
        <p className="text-muted">
          Tous les fichiers déposés (factures Indy manuelles, contrats, briefs…).
        </p>
      </header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
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
