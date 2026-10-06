import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { TRADE_SLUGS, trades } from "~/data/trades";
import { ANALYSIS_FLAGS } from "~/lib/crmAnalysis";
import { findDuplicateProspects, type DuplicateMatch } from "~/lib/crm";
import type {
  Prospect,
  ProspectInteraction,
  ProspectTask,
} from "~/lib/crm.types";
import { useAuth } from "~/lib/auth";
import { formatDateFr } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ProspectConvertPanel } from "~/components/portal/ProspectConvertPanel";
import { ProspectDemosPanel } from "~/components/portal/ProspectDemosPanel";
import { ProspectEmailsPanel } from "~/components/portal/ProspectEmailsPanel";
import { ErrorState, LoadingState, PortalSection } from "~/components/portal/PortalUi";

export const meta = () => [{ title: "Fiche prospect — Administration" }];

export default function AdminProspectDetail() {
  const { prospectId } = useParams();
  const { user } = useAuth();
  const { refs, byId, byCode, activeOnly } = useCrmRefs();

  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [allProspects, setAllProspects] = useState<Prospect[]>([]);
  const [tasks, setTasks] = useState<ProspectTask[]>([]);
  const [interactions, setInteractions] = useState<ProspectInteraction[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dupes, setDupes] = useState<DuplicateMatch[]>([]);

  // Forms
  const [noteDetail, setNoteDetail] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTypeId, setTaskTypeId] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskDetail, setTaskDetail] = useState("");
  const [interactionTypeId, setInteractionTypeId] = useState("");
  const [interactionDetail, setInteractionDetail] = useState("");
  const [dncReasonId, setDncReasonId] = useState("");
  const [dncNote, setDncNote] = useState("");

  async function reload() {
    if (!prospectId) return;
    const sb = getSupabase();
    if (!sb) return;
    const [p, all, t, i, tags] = await Promise.all([
      sb.from("prospects").select("*").eq("id", prospectId).maybeSingle(),
      sb.from("prospects").select("*"),
      sb
        .from("prospect_tasks")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("due_at"),
      sb
        .from("prospect_interactions")
        .select("*")
        .eq("prospect_id", prospectId)
        .order("created_at", { ascending: false }),
      sb.from("prospect_tag_links").select("tag_id").eq("prospect_id", prospectId),
    ]);
    if (p.error) setError(p.error.message);
    setProspect((p.data as Prospect | null) ?? null);
    setAllProspects((all.data as Prospect[]) ?? []);
    setTasks((t.data as ProspectTask[]) ?? []);
    setInteractions((i.data as ProspectInteraction[]) ?? []);
    setTagIds(((tags.data as { tag_id: string }[]) ?? []).map((x) => x.tag_id));
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospectId]);

  useEffect(() => {
    if (!prospect) return;
    setDncReasonId(prospect.do_not_contact_reason_id ?? "");
    setDncNote(prospect.do_not_contact_note ?? "");
  }, [prospect]);

  const nextTask = useMemo(
    () => tasks.find((t) => !t.completed_at) ?? null,
    [tasks],
  );

  async function saveProspect(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!prospectId || !prospect) return;
    const sb = getSupabase();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const payload: Partial<Prospect> = {
      company_name: String(fd.get("company_name") || "").trim(),
      commercial_name: strOrNull(fd.get("commercial_name")),
      trade_slug: strOrNull(fd.get("trade_slug")),
      specialty: strOrNull(fd.get("specialty")),
      contact_first_name: strOrNull(fd.get("contact_first_name")),
      contact_last_name: strOrNull(fd.get("contact_last_name")),
      contact_role: strOrNull(fd.get("contact_role")),
      email: strOrNull(fd.get("email")),
      phone: strOrNull(fd.get("phone")),
      address: strOrNull(fd.get("address")),
      postal_code: strOrNull(fd.get("postal_code")),
      city: strOrNull(fd.get("city")),
      department: strOrNull(fd.get("department")),
      service_area: strOrNull(fd.get("service_area")),
      website_url: strOrNull(fd.get("website_url")),
      google_business_url: strOrNull(fd.get("google_business_url")),
      facebook_url: strOrNull(fd.get("facebook_url")),
      instagram_url: strOrNull(fd.get("instagram_url")),
      linkedin_url: strOrNull(fd.get("linkedin_url")),
      status_id: String(fd.get("status_id")),
      priority_id: String(fd.get("priority_id")),
      source_id: strOrNull(fd.get("source_id")),
      analysis_notes: strOrNull(fd.get("analysis_notes")),
      internal_notes: strOrNull(fd.get("internal_notes")),
      analysis_flags: fd.getAll("analysis_flags").map(String),
    };

    const matches = findDuplicateProspects(payload, allProspects, prospectId);
    if (matches.length && !confirm("Prospect similaire détecté. Continuer quand même ?")) {
      setDupes(matches);
      return;
    }
    setDupes([]);

    const { error: err } = await sb.from("prospects").update(payload).eq("id", prospectId);
    if (err) setError(err.message);
    else {
      setOk("Prospect enregistré.");
      setEditing(false);
      await reload();
    }
  }

  async function changeStatus(statusId: string) {
    if (!prospectId) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb
      .from("prospects")
      .update({ status_id: statusId })
      .eq("id", prospectId);
    if (err) setError(err.message);
    else await reload();
  }

  async function archiveToggle() {
    if (!prospectId || !prospect) return;
    const sb = getSupabase();
    if (!sb) return;
    const archived_at = prospect.archived_at ? null : new Date().toISOString();
    const { error: err } = await sb
      .from("prospects")
      .update({ archived_at })
      .eq("id", prospectId);
    if (err) setError(err.message);
    else await reload();
  }

  async function addNote(e: FormEvent) {
    e.preventDefault();
    if (!prospectId || !user || !noteDetail.trim()) return;
    const sb = getSupabase();
    if (!sb) return;
    const typeId = byCode(refs.interactionTypes, "note")?.id;
    if (!typeId) return;
    const { error: err } = await sb.from("prospect_interactions").insert({
      prospect_id: prospectId,
      interaction_type_id: typeId,
      title: "Note",
      detail: noteDetail.trim(),
      created_by: user.id,
    });
    if (err) setError(err.message);
    else {
      setNoteDetail("");
      setOk("Note ajoutée.");
      await reload();
    }
  }

  async function addInteraction(e: FormEvent) {
    e.preventDefault();
    if (!prospectId || !user || !interactionTypeId) return;
    const sb = getSupabase();
    if (!sb) return;
    const type = byId(refs.interactionTypes, interactionTypeId);
    const { error: err } = await sb.from("prospect_interactions").insert({
      prospect_id: prospectId,
      interaction_type_id: interactionTypeId,
      title: type?.label ?? "Interaction",
      detail: interactionDetail.trim() || null,
      created_by: user.id,
    });
    if (err) setError(err.message);
    else {
      setInteractionDetail("");
      setOk("Interaction enregistrée.");
      await reload();
    }
  }

  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!prospectId || !user || !taskTitle.trim() || !taskTypeId || !taskDue) return;
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.from("prospect_tasks").insert({
      prospect_id: prospectId,
      task_type_id: taskTypeId,
      title: taskTitle.trim(),
      detail: taskDetail.trim() || null,
      due_at: new Date(taskDue).toISOString(),
      created_by: user.id,
    });
    if (err) setError(err.message);
    else {
      setTaskTitle("");
      setTaskDetail("");
      setTaskDue("");
      setOk("Tâche planifiée.");
      await reload();
    }
  }

  async function completeTask(task: ProspectTask) {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb
      .from("prospect_tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", task.id);
    if (err) setError(err.message);
    else await reload();
  }

  async function toggleTag(tagId: string, on: boolean) {
    if (!prospectId) return;
    const sb = getSupabase();
    if (!sb) return;
    if (on) {
      const { error: err } = await sb
        .from("prospect_tag_links")
        .insert({ prospect_id: prospectId, tag_id: tagId });
      if (err) setError(err.message);
    } else {
      const { error: err } = await sb
        .from("prospect_tag_links")
        .delete()
        .eq("prospect_id", prospectId)
        .eq("tag_id", tagId);
      if (err) setError(err.message);
    }
    await reload();
  }

  async function saveDnc(e: FormEvent) {
    e.preventDefault();
    if (!prospectId || !user) return;
    const sb = getSupabase();
    if (!sb) return;
    const enable = (e.currentTarget.elements.namedItem("dnc_on") as HTMLInputElement)
      ?.checked;
    const payload = enable
      ? {
          do_not_contact: true,
          do_not_contact_reason_id: dncReasonId || null,
          do_not_contact_note: dncNote.trim() || null,
          do_not_contact_at: new Date().toISOString(),
          do_not_contact_by: user.id,
        }
      : {
          do_not_contact: false,
          do_not_contact_reason_id: null,
          do_not_contact_note: null,
          do_not_contact_at: null,
          do_not_contact_by: null,
        };
    const { error: err } = await sb.from("prospects").update(payload).eq("id", prospectId);
    if (err) setError(err.message);
    else {
      setOk(enable ? "Ne plus contacter activé." : "Ne plus contacter désactivé.");
      await reload();
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setOk("Copié.");
  }

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="admin-page">
        <ErrorState message={error || "Prospect introuvable."} />
        <Link to="/admin/prospects">← Prospects</Link>
      </div>
    );
  }

  const status = byId(refs.statuses, prospect.status_id);
  const priority = byId(refs.priorities, prospect.priority_id);
  const tradeLabel = prospect.trade_slug
    ? trades[prospect.trade_slug as keyof typeof trades]?.label ?? prospect.trade_slug
    : "—";

  const manualInteractionTypes = activeOnly(refs.interactionTypes).filter(
    (t) => !t.is_system,
  );

  return (
    <div className="admin-page">
      <p>
        <Link to="/admin/prospects">← Prospects</Link>
      </p>

      {prospect.do_not_contact && (
        <div className="crm-dnc-banner" role="status">
          NE PLUS CONTACTER
          {prospect.do_not_contact_reason_id && (
            <span>
              {" — "}
              {byId(refs.dncReasons, prospect.do_not_contact_reason_id)?.label}
            </span>
          )}
        </div>
      )}

      <header className="admin-page__header">
        <div className="admin-page__header-row">
          <div>
            <h1>{prospect.company_name}</h1>
            <p className="text-muted">
              {tradeLabel}
              {prospect.city ? ` · ${prospect.city}` : ""}
              {" · "}
              {status?.label ?? "—"}
              {" · "}
              {priority?.label ?? "—"}
              {prospect.archived_at ? " · Archivé" : ""}
            </p>
          </div>
          <div className="crm-header-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setEditing((v) => !v)}>
              {editing ? "Fermer l’édition" : "Modifier"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void archiveToggle()}>
              {prospect.archived_at ? "Restaurer" : "Archiver"}
            </button>
          </div>
        </div>
      </header>

      <div className="crm-future-actions">
        <a href="#demos" className="btn btn-ghost">
          Créer une démo
        </a>
        <a href="#emails" className="btn btn-ghost">
          Préparer un e-mail
        </a>
        <a href="#conversion" className="btn btn-ghost">
          {prospect.converted_at ? "Voir la conversion" : "Transformer en client"}
        </a>
      </div>

      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}
      {dupes.length > 0 && (
        <div className="crm-dupe-alert">
          <p>
            {dupes.some((d) => d.prospect.do_not_contact)
              ? "Un prospect similaire existe déjà — Ne plus contacter."
              : "Prospects similaires :"}
          </p>
          <ul>
            {dupes.map((d) => (
              <li key={d.prospect.id}>
                <Link to={`/admin/prospects/${d.prospect.id}`}>{d.prospect.company_name}</Link>
                {" — "}
                {d.reasons.join(", ")}
                {d.prospect.archived_at ? " · Archivé" : ""}
                {d.prospect.do_not_contact ? " · Ne plus contacter" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      <PortalSection title="Résumé">
        <div className="crm-summary-grid">
          <label>
            Statut
            <select
              value={prospect.status_id}
              onChange={(e) => void changeStatus(e.target.value)}
            >
              {(editing ? refs.statuses : activeOnly(refs.statuses).concat(
                status && !status.is_active ? [status] : [],
              )).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <p>
            <strong>Prochaine action :</strong>{" "}
            {nextTask && !prospect.do_not_contact
              ? `${nextTask.title} · ${formatDateFr(nextTask.due_at)}`
              : "Aucune"}
          </p>
        </div>
      </PortalSection>

      {editing ? (
        <form className="stack-form" onSubmit={saveProspect}>
          <PortalSection title="Entreprise">
            <div className="admin-form-row">
              <label>
                Nom entreprise *
                <input name="company_name" defaultValue={prospect.company_name} required />
              </label>
              <label>
                Enseigne
                <input name="commercial_name" defaultValue={prospect.commercial_name ?? ""} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Métier
                <select name="trade_slug" defaultValue={prospect.trade_slug ?? ""}>
                  <option value="">—</option>
                  {TRADE_SLUGS.map((s) => (
                    <option key={s} value={s}>
                      {trades[s].label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Spécialité
                <input name="specialty" defaultValue={prospect.specialty ?? ""} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Adresse
                <input name="address" defaultValue={prospect.address ?? ""} />
              </label>
              <label>
                Code postal
                <input name="postal_code" defaultValue={prospect.postal_code ?? ""} />
              </label>
            </div>
            <div className="admin-form-row">
              <label>
                Ville
                <input name="city" defaultValue={prospect.city ?? ""} />
              </label>
              <label>
                Département
                <input name="department" defaultValue={prospect.department ?? ""} />
              </label>
            </div>
            <label>
              Zone d’intervention
              <input name="service_area" defaultValue={prospect.service_area ?? ""} />
            </label>
          </PortalSection>

          <PortalSection title="Contact">
            <div className="admin-form-row">
              <label>
                Prénom
                <input
                  name="contact_first_name"
                  defaultValue={prospect.contact_first_name ?? ""}
                />
              </label>
              <label>
                Nom
                <input
                  name="contact_last_name"
                  defaultValue={prospect.contact_last_name ?? ""}
                />
              </label>
            </div>
            <label>
              Fonction
              <input name="contact_role" defaultValue={prospect.contact_role ?? ""} />
            </label>
            <div className="admin-form-row">
              <label>
                E-mail
                <input name="email" type="email" defaultValue={prospect.email ?? ""} />
              </label>
              <label>
                Téléphone
                <input name="phone" defaultValue={prospect.phone ?? ""} />
              </label>
            </div>
          </PortalSection>

          <PortalSection title="Présence numérique">
            <label>
              Site internet
              <input name="website_url" defaultValue={prospect.website_url ?? ""} />
            </label>
            <label>
              Fiche Google
              <input
                name="google_business_url"
                defaultValue={prospect.google_business_url ?? ""}
              />
            </label>
            <label>
              Facebook
              <input name="facebook_url" defaultValue={prospect.facebook_url ?? ""} />
            </label>
            <label>
              Instagram
              <input name="instagram_url" defaultValue={prospect.instagram_url ?? ""} />
            </label>
            <label>
              LinkedIn
              <input name="linkedin_url" defaultValue={prospect.linkedin_url ?? ""} />
            </label>
          </PortalSection>

          <PortalSection title="Statut & priorité">
            <div className="admin-form-row">
              <label>
                Statut
                <select name="status_id" defaultValue={prospect.status_id}>
                  {refs.statuses
                    .filter((s) => s.is_active || s.id === prospect.status_id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Priorité
                <select name="priority_id" defaultValue={prospect.priority_id}>
                  {refs.priorities
                    .filter((p) => p.is_active || p.id === prospect.priority_id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Source
                <select name="source_id" defaultValue={prospect.source_id ?? ""}>
                  <option value="">—</option>
                  {refs.sources
                    .filter((s) => s.is_active || s.id === prospect.source_id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </PortalSection>

          <PortalSection title="Analyse">
            <div className="crm-flags">
              {ANALYSIS_FLAGS.map((f) => (
                <label key={f.code} className="portal-check">
                  <input
                    type="checkbox"
                    name="analysis_flags"
                    value={f.code}
                    defaultChecked={prospect.analysis_flags?.includes(f.code)}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <label>
              Notes d’analyse
              <textarea
                name="analysis_notes"
                rows={3}
                defaultValue={prospect.analysis_notes ?? ""}
              />
            </label>
          </PortalSection>

          <PortalSection title="Notes internes">
            <textarea
              name="internal_notes"
              rows={4}
              defaultValue={prospect.internal_notes ?? ""}
            />
          </PortalSection>

          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </form>
      ) : (
        <>
          <PortalSection title="Entreprise">
            <dl className="crm-dl">
              <div>
                <dt>Enseigne</dt>
                <dd>{prospect.commercial_name || "—"}</dd>
              </div>
              <div>
                <dt>Spécialité</dt>
                <dd>{prospect.specialty || "—"}</dd>
              </div>
              <div>
                <dt>Adresse</dt>
                <dd>
                  {[prospect.address, prospect.postal_code, prospect.city]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt>Département</dt>
                <dd>{prospect.department || "—"}</dd>
              </div>
              <div>
                <dt>Zone</dt>
                <dd>{prospect.service_area || "—"}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{byId(refs.sources, prospect.source_id)?.label ?? "—"}</dd>
              </div>
            </dl>
          </PortalSection>

          <PortalSection title="Contact">
            <dl className="crm-dl">
              <div>
                <dt>Nom</dt>
                <dd>
                  {[prospect.contact_first_name, prospect.contact_last_name]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </dd>
              </div>
              <div>
                <dt>Fonction</dt>
                <dd>{prospect.contact_role || "—"}</dd>
              </div>
              <div>
                <dt>E-mail</dt>
                <dd>
                  {prospect.email ? (
                    <>
                      <a href={`mailto:${prospect.email}`}>{prospect.email}</a>{" "}
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => copy(prospect.email!)}
                      >
                        Copier
                      </button>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt>Téléphone</dt>
                <dd>
                  {prospect.phone ? (
                    <>
                      <a href={`tel:${prospect.phone}`}>{prospect.phone}</a>{" "}
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => copy(prospect.phone!)}
                      >
                        Copier
                      </button>
                    </>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          </PortalSection>

          <PortalSection title="Présence numérique">
            <ul className="crm-links">
              <ExtLink label="Site internet" href={prospect.website_url} />
              <ExtLink label="Fiche Google" href={prospect.google_business_url} />
              <ExtLink label="Facebook" href={prospect.facebook_url} />
              <ExtLink label="Instagram" href={prospect.instagram_url} />
              <ExtLink label="LinkedIn" href={prospect.linkedin_url} />
            </ul>
          </PortalSection>

          <PortalSection title="Analyse">
            {prospect.analysis_flags?.length ? (
              <ul className="crm-flag-list">
                {prospect.analysis_flags.map((code) => (
                  <li key={code}>
                    {ANALYSIS_FLAGS.find((f) => f.code === code)?.label ?? code}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Aucun critère coché.</p>
            )}
            {prospect.analysis_notes && <p>{prospect.analysis_notes}</p>}
          </PortalSection>

          {prospect.internal_notes && (
            <PortalSection title="Notes internes">
              <p style={{ whiteSpace: "pre-wrap" }}>{prospect.internal_notes}</p>
            </PortalSection>
          )}
        </>
      )}

      <ProspectConvertPanel prospect={prospect} onConverted={() => void reload()} />

      <div id="emails">
        <ProspectEmailsPanel prospect={prospect} onChanged={() => void reload()} />
      </div>

      <div id="demos">
        <ProspectDemosPanel
          prospect={prospect}
          onInteractionLogged={() => void reload()}
        />
      </div>

      <PortalSection title="Tags">
        <div className="crm-tags">
          {refs.tags
            .filter((t) => t.is_active || tagIds.includes(t.id))
            .map((t) => (
              <label key={t.id} className="portal-check">
                <input
                  type="checkbox"
                  checked={tagIds.includes(t.id)}
                  disabled={!t.is_active && !tagIds.includes(t.id)}
                  onChange={(e) => void toggleTag(t.id, e.target.checked)}
                />
                {t.label}
                {!t.is_active ? " (inactif)" : ""}
              </label>
            ))}
        </div>
      </PortalSection>

      <PortalSection title="Ne plus contacter">
        <form className="stack-form" onSubmit={saveDnc}>
          <label className="portal-check">
            <input
              type="checkbox"
              name="dnc_on"
              defaultChecked={prospect.do_not_contact}
            />
            Activer « Ne plus contacter »
          </label>
          <label>
            Motif
            <select
              value={dncReasonId}
              onChange={(e) => setDncReasonId(e.target.value)}
            >
              <option value="">—</option>
              {refs.dncReasons
                .filter(
                  (r) =>
                    r.is_active || r.id === prospect.do_not_contact_reason_id,
                )
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Note
            <textarea
              rows={2}
              value={dncNote}
              onChange={(e) => setDncNote(e.target.value)}
            />
          </label>
          {prospect.do_not_contact_at && (
            <p className="text-muted">
              Activé le {formatDateFr(prospect.do_not_contact_at)}
            </p>
          )}
          <button type="submit" className="btn btn-ghost">
            Enregistrer
          </button>
        </form>
      </PortalSection>

      <PortalSection title="Prochaine action / tâches">
        {tasks.length === 0 ? (
          <p className="text-muted">Aucune tâche.</p>
        ) : (
          <ul className="crm-task-list">
            {tasks.map((t) => (
              <li key={t.id} data-done={t.completed_at ? "1" : "0"}>
                <div>
                  <strong>{t.title}</strong>
                  <span className="text-muted">
                    {" "}
                    · {byId(refs.taskTypes, t.task_type_id)?.label} ·{" "}
                    {formatDateFr(t.due_at)}
                    {t.completed_at ? ` · terminée ${formatDateFr(t.completed_at)}` : ""}
                  </span>
                  {t.detail && <p className="text-muted">{t.detail}</p>}
                </div>
                {!t.completed_at && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void completeTask(t)}
                  >
                    Terminer
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <h3 className="portal-subhead">Planifier une action</h3>
        <form className="stack-form" onSubmit={addTask}>
          <label>
            Type
            <select
              required
              value={taskTypeId}
              onChange={(e) => setTaskTypeId(e.target.value)}
            >
              <option value="">—</option>
              {activeOnly(refs.taskTypes).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Titre
            <input
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
          </label>
          <label>
            Échéance
            <input
              type="datetime-local"
              required
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
            />
          </label>
          <label>
            Détail
            <textarea
              rows={2}
              value={taskDetail}
              onChange={(e) => setTaskDetail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Planifier
          </button>
        </form>
      </PortalSection>

      <PortalSection title="Historique">
        <form className="stack-form" onSubmit={addNote} style={{ marginBottom: "1rem" }}>
          <label>
            Ajouter une note
            <textarea
              required
              rows={2}
              value={noteDetail}
              onChange={(e) => setNoteDetail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-ghost">
            Enregistrer la note
          </button>
        </form>
        <form className="stack-form" onSubmit={addInteraction}>
          <label>
            Logger une interaction
            <select
              required
              value={interactionTypeId}
              onChange={(e) => setInteractionTypeId(e.target.value)}
            >
              <option value="">—</option>
              {manualInteractionTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Détail
            <textarea
              rows={2}
              value={interactionDetail}
              onChange={(e) => setInteractionDetail(e.target.value)}
            />
          </label>
          <button type="submit" className="btn btn-ghost">
            Ajouter
          </button>
        </form>
        <ol className="crm-history">
          {interactions.map((i) => (
            <li key={i.id}>
              <div className="crm-history__head">
                <strong>
                  {byId(refs.interactionTypes, i.interaction_type_id)?.label ??
                    i.title ??
                    "Interaction"}
                </strong>
                <time dateTime={i.created_at}>{formatDateFr(i.created_at)}</time>
              </div>
              {i.detail && <p className="text-muted">{i.detail}</p>}
            </li>
          ))}
        </ol>
      </PortalSection>
    </div>
  );
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function ExtLink({ label, href }: { label: string; href: string | null }) {
  if (!href) {
    return (
      <li>
        <span className="text-muted">{label} —</span>
      </li>
    );
  }
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <li>
      <a href={url} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    </li>
  );
}
