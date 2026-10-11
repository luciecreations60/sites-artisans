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
  type DocumentRow,
  type MaintenanceQuota,
  type Project,
  type ProjectEvent,
} from "~/lib/supabase.types";
import type { QuoteRow, SiteConfigurationRow } from "~/lib/commercial/types";

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
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [configuration, setConfiguration] = useState<SiteConfigurationRow | null>(null);
  const [commercialPending, setCommercialPending] = useState(false);
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
        sb
          .from("project_events")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true }),
        sb
          .from("documents")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
        sb
          .from("checklist_items")
          .select("*")
          .eq("project_id", projectId)
          .order("sort_order"),
        sb
          .from("change_requests")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false }),
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

      // Lot 5/7 — devis émis + config (RLS) ; silence si migration absente
      const [quotesRes, cfgRes] = await Promise.all([
        sb
          .from("quotes")
          .select(
            "id, reference, kind, status, plan_id, trade_slug, creation_ht_cents, issued_at, locked, project_id, configuration_id",
          )
          .eq("project_id", projectId)
          .eq("kind", "issued")
          .order("issued_at", { ascending: false }),
        sb
          .from("site_configurations")
          .select(
            "id, trade_slug, plan_id, company_name, city, specialty, theme_id, desired_feature_ids, status",
          )
          .eq("project_id", projectId)
          .maybeSingle(),
      ]);
      if (!active) return;
      if (quotesRes.error || cfgRes.error) {
        const msg = quotesRes.error?.message || cfgRes.error?.message || "";
        if (/does not exist|relation|42P01|permission denied/i.test(msg)) {
          setCommercialPending(true);
        }
      } else {
        setQuotes((quotesRes.data as QuoteRow[]) ?? []);
        setConfiguration((cfgRes.data as SiteConfigurationRow | null) ?? null);
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user, projectId]);

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
          <LoadingState />
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
          {error ? <ErrorState message={error} /> : <LoadingState label="Projet introuvable." />}
          <p style={{ marginTop: "1rem" }}>
            <Link to="/espace-client">Retour à mes projets</Link>
          </p>
        </div>
      </section>
    );
  }

  const pending = checklist.filter((c) => !c.done);

  return (
    <section className="section">
      <div className="container portal-project-page">
        <p>
          <Link to="/espace-client">← Mes projets</Link>
        </p>
        <header className="portal-project-hero">
          <h1>{project.title}</h1>
          <p className="text-muted">
            {PROJECT_STATUS_LABELS[project.status]}
            {project.offer_tier ? ` · ${offerLabel(project.offer_tier)}` : ""}
            {project.domain ? ` · ${project.domain}` : ""}
          </p>
          {pending.length > 0 && (
            <p className="portal-action-needed">
              Action requise : {pending.length} élément{pending.length > 1 ? "s" : ""} à fournir
            </p>
          )}
        </header>

        {error && <ErrorState message={error} />}

        <PortalSection title="Avancement">
          <ProjectTimeline status={project.status} events={events} />
        </PortalSection>

        <PortalSection title="Configuration & devis">
          {commercialPending ? (
            <p className="text-muted">
              Module commercial non disponible (migration lot 5 non appliquée ou droits en
              attente). Aucune donnée inventée.
            </p>
          ) : (
            <>
              {configuration ? (
                <ul style={{ marginTop: 0 }}>
                  <li>
                    Entreprise : {configuration.company_name || "—"}
                    {configuration.city ? ` · ${configuration.city}` : ""}
                  </li>
                  <li>
                    Formule : {configuration.plan_id || "—"} · Métier :{" "}
                    {configuration.trade_slug || "—"}
                  </li>
                  <li>
                    Options :{" "}
                    {(configuration.desired_feature_ids ?? []).join(", ") || "aucune"}
                  </li>
                </ul>
              ) : (
                <p className="text-muted">Aucune configuration liée pour l’instant.</p>
              )}
              {quotes.length === 0 ? (
                <p className="text-muted">Aucun devis émis accessible.</p>
              ) : (
                <ul className="portal-doc-list">
                  {quotes.map((quote) => (
                    <li key={quote.id}>
                      <span>
                        Devis {quote.reference || quote.id.slice(0, 8)} — {quote.status}
                        {quote.locked ? " (verrouillé)" : ""}
                      </span>
                      <span className="text-muted">
                        {quote.issued_at ? formatDateFr(quote.issued_at) : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-muted" style={{ fontSize: "0.875rem" }}>
                Aperçu du site de production : disponible après génération et partage sécurisé
                (pas d’URL publique non protégée). État actuel : non publié ici.
              </p>
            </>
          )}
        </PortalSection>

        <PortalSection title="Checklist / éléments à fournir">
          <ChecklistPanel items={checklist} />
        </PortalSection>

        <PortalSection title="Documents">
          <p className="text-muted" style={{ fontSize: "0.9375rem", marginTop: 0 }}>
            Factures et documents déposés manuellement.
          </p>
          {docs.length === 0 ? (
            <p className="text-muted">Aucun document pour l’instant.</p>
          ) : (
            <ul className="portal-doc-list">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <button type="button" className="linkish" onClick={() => void openDocument(doc)}>
                    {DOCUMENT_KIND_LABELS[doc.kind]} — {doc.title}
                  </button>
                  <span className="text-muted">{formatDateFr(doc.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </PortalSection>

        <PortalSection title="Mes demandes">
          <ChangeRequestsList requests={requests} />
          <h3 className="portal-subhead">Nouvelle demande</h3>
          <form className="stack-form" onSubmit={submitRequest}>
            <label>
              Titre
              <input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label>
              Description
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              {sending ? "Envoi…" : "Envoyer la demande"}
            </button>
            {sentOk && <p className="portal-success">Demande enregistrée.</p>}
          </form>
        </PortalSection>

        {quota && (
          <PortalSection title="Maintenance">
            <MaintenanceCard
              hoursIncluded={Number(quota.hours_included)}
              hoursUsed={Number(quota.hours_used)}
            />
          </PortalSection>
        )}
      </div>
    </section>
  );
}
