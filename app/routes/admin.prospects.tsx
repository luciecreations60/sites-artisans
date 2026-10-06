import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { TRADE_SLUGS, trades } from "~/data/trades";
import {
  addDays,
  CRM_VIEW_KEY,
  endOfDay,
  findDuplicateProspects,
  startOfDay,
  type DuplicateMatch,
} from "~/lib/crm";
import type { Prospect, ProspectTask } from "~/lib/crm.types";
import { formatDateFr } from "~/lib/portal";
import { isValidEmailAddress } from "~/lib/prospectEmail";
import type { CrmEmailSettings } from "~/lib/prospectEmail.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";
import { useAuth } from "~/lib/auth";

export const meta = () => [{ title: "Prospects — Administration" }];

type ViewMode = "liste" | "kanban";

type TaskWithProspect = ProspectTask & { prospect?: Prospect };

const emptyFilters = {
  statusId: "",
  trade: "",
  city: "",
  department: "",
  priorityId: "",
  sourceId: "",
  tagId: "",
  nextAction: "",
  archive: "actifs",
  dnc: "",
  q: "",
};

export default function AdminProspects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refs, loading: refsLoading, error: refsError, byId, byCode, activeOnly } =
    useCrmRefs();

  const [view, setView] = useState<ViewMode>(() => {
    if (typeof localStorage === "undefined") return "liste";
    return localStorage.getItem(CRM_VIEW_KEY) === "kanban" ? "kanban" : "liste";
  });
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [tasks, setTasks] = useState<ProspectTask[]>([]);
  const [tagLinks, setTagLinks] = useState<{ prospect_id: string; tag_id: string }[]>([]);
  const [interactions, setInteractions] = useState<
    { prospect_id: string; created_at: string; interaction_type_id: string }[]
  >([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [showClosedKanban, setShowClosedKanban] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showQuick, setShowQuick] = useState(false);
  const [quick, setQuick] = useState({
    company_name: "",
    trade_slug: "",
    city: "",
    website_url: "",
    email: "",
    phone: "",
    source_id: "",
  });
  const [dupes, setDupes] = useState<DuplicateMatch[]>([]);
  const [forceCreate, setForceCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emailSettings, setEmailSettings] = useState<CrmEmailSettings | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  async function reload() {
    const sb = getSupabase();
    if (!sb) return;
    const [p, t, tl, i] = await Promise.all([
      sb.from("prospects").select("*").order("updated_at", { ascending: false }),
      sb.from("prospect_tasks").select("*").is("completed_at", null).order("due_at"),
      sb.from("prospect_tag_links").select("prospect_id, tag_id"),
      sb
        .from("prospect_interactions")
        .select("prospect_id, created_at, interaction_type_id")
        .order("created_at", { ascending: false }),
    ]);
    if (p.error || t.error) {
      setError(p.error?.message || t.error?.message || "Erreur chargement");
    } else {
      setProspects((p.data as Prospect[]) ?? []);
      setTasks((t.data as ProspectTask[]) ?? []);
      setTagLinks((tl.data as { prospect_id: string; tag_id: string }[]) ?? []);
      setInteractions(
        (i.data as { prospect_id: string; created_at: string; interaction_type_id: string }[]) ??
          [],
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    const sb = getSupabase();
    if (!sb) return;
    void sb
      .from("crm_email_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setEmailSettings((data as CrmEmailSettings | null) ?? null));
  }, []);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    localStorage.setItem(CRM_VIEW_KEY, mode);
  }

  const nextTaskByProspect = useMemo(() => {
    const map = new Map<string, ProspectTask>();
    for (const t of tasks) {
      if (!map.has(t.prospect_id)) map.set(t.prospect_id, t);
    }
    return map;
  }, [tasks]);

  const contactTypeIds = useMemo(
    () => new Set(refs.interactionTypes.filter((t) => t.counts_as_contact).map((t) => t.id)),
    [refs.interactionTypes],
  );

  const lastContactByProspect = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of interactions) {
      if (!contactTypeIds.has(i.interaction_type_id)) continue;
      if (!map.has(i.prospect_id)) map.set(i.prospect_id, i.created_at);
    }
    return map;
  }, [interactions, contactTypeIds]);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekEnd = endOfDay(addDays(now, 7));

    return prospects.filter((p) => {
      if (filters.archive === "actifs" && p.archived_at) return false;
      if (filters.archive === "archives" && !p.archived_at) return false;
      if (filters.statusId && p.status_id !== filters.statusId) return false;
      if (filters.trade && p.trade_slug !== filters.trade) return false;
      if (filters.city && !(p.city ?? "").toLowerCase().includes(filters.city.toLowerCase()))
        return false;
      if (
        filters.department &&
        !(p.department ?? "").toLowerCase().includes(filters.department.toLowerCase())
      )
        return false;
      if (filters.priorityId && p.priority_id !== filters.priorityId) return false;
      if (filters.sourceId && p.source_id !== filters.sourceId) return false;
      if (filters.dnc === "oui" && !p.do_not_contact) return false;
      if (filters.dnc === "non" && p.do_not_contact) return false;
      if (filters.tagId) {
        const has = tagLinks.some(
          (l) => l.prospect_id === p.id && l.tag_id === filters.tagId,
        );
        if (!has) return false;
      }
      if (filters.nextAction) {
        const task = nextTaskByProspect.get(p.id);
        if (!task || p.do_not_contact) return false;
        const due = new Date(task.due_at);
        if (filters.nextAction === "retard" && due >= todayStart) return false;
        if (filters.nextAction === "aujourd_hui" && (due < todayStart || due > todayEnd))
          return false;
        if (filters.nextAction === "7j" && (due < todayStart || due > weekEnd)) return false;
      }
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const blob = [
          p.company_name,
          p.city,
          p.email,
          p.phone,
          p.trade_slug,
          p.contact_first_name,
          p.contact_last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [prospects, filters, tagLinks, nextTaskByProspect]);

  const dueBuckets = useMemo(() => {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const weekEnd = endOfDay(addDays(new Date(), 7));
    const prospectMap = new Map(prospects.map((p) => [p.id, p]));
    const open = tasks
      .map((t) => ({ ...t, prospect: prospectMap.get(t.prospect_id) }))
      .filter((t) => t.prospect && !t.prospect.do_not_contact && !t.prospect.archived_at);

    const overdue: TaskWithProspect[] = [];
    const today: TaskWithProspect[] = [];
    const week: TaskWithProspect[] = [];
    for (const t of open) {
      const due = new Date(t.due_at);
      if (due < todayStart) overdue.push(t);
      else if (due <= todayEnd) today.push(t);
      else if (due <= weekEnd) week.push(t);
    }
    return { overdue, today, week };
  }, [tasks, prospects]);

  const kanbanStatuses = useMemo(() => {
    const list = activeOnly(refs.statuses);
    return showClosedKanban ? list : list.filter((s) => !s.is_closed);
  }, [refs.statuses, showClosedKanban, activeOnly]);

  async function createProspect(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !user) return;
    const payload = {
      company_name: quick.company_name.trim(),
      trade_slug: quick.trade_slug || null,
      city: quick.city.trim() || null,
      website_url: quick.website_url.trim() || null,
      email: quick.email.trim() || null,
      phone: quick.phone.trim() || null,
      source_id: quick.source_id || null,
      status_id: byCode(refs.statuses, "a_analyser")?.id,
      priority_id: byCode(refs.priorities, "normale")?.id,
      created_by: user.id,
    };
    if (!payload.company_name) return;
    if (!payload.status_id || !payload.priority_id) {
      setError("Référentiels CRM incomplets (statut / priorité).");
      return;
    }

    if (!forceCreate) {
      const matches = findDuplicateProspects(payload, prospects);
      if (matches.length) {
        setDupes(matches);
        return;
      }
    }

    setCreating(true);
    setError(null);
    const { data, error: err } = await sb
      .from("prospects")
      .insert(payload)
      .select("id")
      .single();
    setCreating(false);
    if (err || !data) {
      setError(err?.message ?? "Création impossible");
      return;
    }
    navigate(`/admin/prospects/${data.id}`);
  }

  async function moveStatus(prospectId: string, statusId: string) {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb
      .from("prospects")
      .update({ status_id: statusId })
      .eq("id", prospectId);
    if (err) setError(err.message);
    else await reload();
  }

  function tradeLabel(slug: string | null) {
    if (!slug) return "—";
    return trades[slug as keyof typeof trades]?.label ?? slug;
  }

  const maxCampaign = emailSettings?.default_campaign_max_recipients ?? 50;

  const selectableFiltered = useMemo(
    () =>
      filtered.filter(
        (p) => !p.do_not_contact && !p.archived_at && isValidEmailAddress(p.email),
      ),
    [filtered],
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= maxCampaign) {
          setError(`Limite campagne : ${maxCampaign} destinataires.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectVisible() {
    const next = new Set<string>();
    for (const p of selectableFiltered) {
      if (next.size >= maxCampaign) break;
      next.add(p.id);
    }
    setSelected(next);
    if (selectableFiltered.length > maxCampaign) {
      setError(`Sélection limitée à ${maxCampaign} (paramètre campagne).`);
    }
  }

  async function createCampaign() {
    const sb = getSupabase();
    if (!sb || !user) return;
    const name = campaignName.trim();
    if (!name) {
      setError("Nom de campagne requis.");
      return;
    }
    const draftCamp = byCode(refs.campaignStatuses, "draft");
    const draftEmail = byCode(refs.emailStatuses, "draft");
    const type = byCode(refs.emailTypes, "first_contact");
    if (!draftCamp || !draftEmail || !type) {
      setError("Référentiels e-mail manquants — exécutez la migration Phase 3.");
      return;
    }
    const ids = [...selected];
    if (!ids.length) return;
    const chosen = prospects.filter((p) => ids.includes(p.id));
    const tradeSlug =
      chosen.every((p) => p.trade_slug && p.trade_slug === chosen[0].trade_slug)
        ? chosen[0].trade_slug
        : filters.trade || null;

    const { data: camp, error: cErr } = await sb
      .from("prospect_email_campaigns")
      .insert({
        name,
        status_id: draftCamp.id,
        trade_slug: tradeSlug,
        created_by: user.id,
      })
      .select("*")
      .single();
    if (cErr || !camp) {
      setError(cErr?.message ?? "Création campagne impossible");
      return;
    }

    const rows = chosen.map((p) => ({
      prospect_id: p.id,
      campaign_id: camp.id,
      email_type_id: type.id,
      email_status_id: draftEmail.id,
      recipient_email: (p.email ?? "").trim(),
      recipient_name: [p.contact_first_name, p.contact_last_name]
        .filter(Boolean)
        .join(" ") || p.company_name,
      subject: "",
      body_text: "",
      created_by: user.id,
    }));
    const { error: eErr } = await sb.from("prospect_emails").insert(rows);
    if (eErr) {
      setError(eErr.message);
      return;
    }
    navigate(`/admin/prospects/campagnes/${camp.id}`);
  }

  if (refsLoading || loading) {
    return (
      <div className="admin-page">
        <LoadingState label="Chargement des prospects…" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__header-row">
          <div>
            <h1>Prospects</h1>
            <p className="text-muted">Pipeline commercial Sites Artisans.</p>
          </div>
          <div className="crm-header-actions">
            <Link to="/admin/prospects/campagnes" className="btn btn-ghost">
              Campagnes
            </Link>
            <Link to="/admin/prospects/parametres" className="btn btn-ghost">
              Paramètres
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setShowQuick((v) => !v);
                setDupes([]);
                setForceCreate(false);
              }}
            >
              {showQuick ? "Fermer" : "+ Ajouter un prospect"}
            </button>
          </div>
        </div>
      </header>

      {(error || refsError) && <ErrorState message={error || refsError || ""} />}

      {showQuick && (
        <form className="stack-form admin-upload-form" onSubmit={createProspect}>
          <h2 className="portal-subhead" style={{ marginTop: 0 }}>
            Création rapide
          </h2>
          <label>
            Nom entreprise *
            <input
              required
              value={quick.company_name}
              onChange={(e) => setQuick({ ...quick, company_name: e.target.value })}
            />
          </label>
          <label>
            Métier
            <select
              value={quick.trade_slug}
              onChange={(e) => setQuick({ ...quick, trade_slug: e.target.value })}
            >
              <option value="">—</option>
              {TRADE_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {trades[s].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ville
            <input
              value={quick.city}
              onChange={(e) => setQuick({ ...quick, city: e.target.value })}
            />
          </label>
          <label>
            Site internet
            <input
              value={quick.website_url}
              onChange={(e) => setQuick({ ...quick, website_url: e.target.value })}
            />
          </label>
          <label>
            E-mail
            <input
              type="email"
              value={quick.email}
              onChange={(e) => setQuick({ ...quick, email: e.target.value })}
            />
          </label>
          <label>
            Téléphone
            <input
              value={quick.phone}
              onChange={(e) => setQuick({ ...quick, phone: e.target.value })}
            />
          </label>
          <label>
            Source
            <select
              value={quick.source_id}
              onChange={(e) => setQuick({ ...quick, source_id: e.target.value })}
            >
              <option value="">—</option>
              {activeOnly(refs.sources).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {dupes.length > 0 && (
            <div className="crm-dupe-alert">
              <p>
                <strong>
                  {dupes.some((d) => d.prospect.do_not_contact)
                    ? "Un prospect similaire existe déjà — Ne plus contacter."
                    : "Un prospect similaire existe déjà."}
                </strong>
              </p>
              <ul>
                {dupes.slice(0, 3).map((d) => (
                  <li key={d.prospect.id}>
                    <Link to={`/admin/prospects/${d.prospect.id}`}>
                      {d.prospect.company_name}
                    </Link>
                    {" — "}
                    {d.reasons.join(", ")}
                    {d.prospect.archived_at ? " · Archivé" : ""}
                    {d.prospect.do_not_contact ? " · Ne plus contacter" : ""}
                  </li>
                ))}
              </ul>
              <div className="crm-header-actions">
                <Link
                  to={`/admin/prospects/${dupes[0].prospect.id}`}
                  className="btn btn-ghost"
                >
                  Voir le prospect existant
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                  onClick={() => setForceCreate(true)}
                >
                  Continuer quand même
                </button>
              </div>
            </div>
          )}

          {dupes.length === 0 && (
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? "Création…" : "Créer le prospect"}
            </button>
          )}
        </form>
      )}

      <div className="crm-due-strip">
        <DueBlock title="En retard" items={dueBuckets.overdue} />
        <DueBlock title="Aujourd’hui" items={dueBuckets.today} />
        <DueBlock title="7 prochains jours" items={dueBuckets.week} />
      </div>

      <div className="crm-toolbar">
        <div className="crm-view-switch" role="group" aria-label="Mode d’affichage">
          <button
            type="button"
            className={view === "liste" ? "is-active" : undefined}
            onClick={() => setViewMode("liste")}
          >
            Liste
          </button>
          <button
            type="button"
            className={view === "kanban" ? "is-active" : undefined}
            onClick={() => setViewMode("kanban")}
          >
            Kanban
          </button>
        </div>
        {view === "kanban" && (
          <label className="portal-check">
            <input
              type="checkbox"
              checked={showClosedKanban}
              onChange={(e) => setShowClosedKanban(e.target.checked)}
            />
            Afficher les statuts fermés
          </label>
        )}
      </div>

      <div className="admin-filters crm-filters">
        <label>
          Recherche
          <input
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            placeholder="Entreprise, ville, contact…"
          />
        </label>
        <label>
          Statut
          <select
            value={filters.statusId}
            onChange={(e) => setFilters({ ...filters, statusId: e.target.value })}
          >
            <option value="">Tous</option>
            {refs.statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {!s.is_active ? " (inactif)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Métier
          <select
            value={filters.trade}
            onChange={(e) => setFilters({ ...filters, trade: e.target.value })}
          >
            <option value="">Tous</option>
            {TRADE_SLUGS.map((s) => (
              <option key={s} value={s}>
                {trades[s].label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Ville
          <input
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          />
        </label>
        <label>
          Département
          <input
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          />
        </label>
        <label>
          Priorité
          <select
            value={filters.priorityId}
            onChange={(e) => setFilters({ ...filters, priorityId: e.target.value })}
          >
            <option value="">Toutes</option>
            {refs.priorities.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <select
            value={filters.sourceId}
            onChange={(e) => setFilters({ ...filters, sourceId: e.target.value })}
          >
            <option value="">Toutes</option>
            {refs.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <select
            value={filters.tagId}
            onChange={(e) => setFilters({ ...filters, tagId: e.target.value })}
          >
            <option value="">Tous</option>
            {refs.tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prochaine action
          <select
            value={filters.nextAction}
            onChange={(e) => setFilters({ ...filters, nextAction: e.target.value })}
          >
            <option value="">Toutes</option>
            <option value="retard">En retard</option>
            <option value="aujourd_hui">Aujourd’hui</option>
            <option value="7j">7 prochains jours</option>
          </select>
        </label>
        <label>
          Archivage
          <select
            value={filters.archive}
            onChange={(e) => setFilters({ ...filters, archive: e.target.value })}
          >
            <option value="actifs">Actifs</option>
            <option value="archives">Archivés</option>
            <option value="tous">Tous</option>
          </select>
        </label>
        <label>
          Ne plus contacter
          <select
            value={filters.dnc}
            onChange={(e) => setFilters({ ...filters, dnc: e.target.value })}
          >
            <option value="">Tous</option>
            <option value="non">Non</option>
            <option value="oui">Oui</option>
          </select>
        </label>
        <div className="crm-filters__clear">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setFilters(emptyFilters)}
          >
            Effacer les filtres
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="text-muted">Aucun prospect ne correspond.</p>
      )}

      {view === "liste" && filtered.length > 0 && (
        <>
          <div className="crm-header-actions" style={{ marginBottom: "0.75rem" }}>
            <button type="button" className="btn btn-ghost" onClick={selectVisible}>
              Sélectionner les visibles (max {maxCampaign})
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setSelected(new Set())}
            >
              Tout désélectionner
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={selected.size === 0}
              onClick={() => {
                setCampaignName(
                  filters.trade
                    ? `${trades[filters.trade as keyof typeof trades]?.label ?? filters.trade}${
                        filters.department ? ` — ${filters.department}` : ""
                      }`
                    : "Campagne prospection",
                );
                setShowCampaignModal(true);
              }}
            >
              Créer une campagne ({selected.size})
            </button>
          </div>
          <p className="text-muted" style={{ fontSize: "0.85rem" }}>
            DNC, archivés et sans e-mail valide exclus de la sélection campagne.
            {filtered.filter((p) => !p.email).length
              ? ` · ${filtered.filter((p) => !isValidEmailAddress(p.email)).length} sans e-mail valide.`
              : ""}
          </p>

          {showCampaignModal && (
            <div className="crm-dupe-alert" style={{ marginBottom: "1rem" }}>
              <h2 className="portal-subhead" style={{ marginTop: 0 }}>
                Nouvelle campagne
              </h2>
              <p>
                {selected.size} prospect(s) sélectionné(s) — max {maxCampaign}.
              </p>
              <label>
                Nom
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  required
                />
              </label>
              <div className="crm-header-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void createCampaign()}
                >
                  Créer et contrôler
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCampaignModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <div className="admin-table-wrap">
            <table className="admin-table crm-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Entreprise</th>
                  <th>Métier</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th>Priorité</th>
                  <th>Prochaine action</th>
                  <th>Dernier contact</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const next = nextTaskByProspect.get(p.id);
                  const canSelect =
                    !p.do_not_contact && !p.archived_at && isValidEmailAddress(p.email);
                  return (
                    <tr key={p.id} className="crm-row-link">
                      <td
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          disabled={!canSelect && !selected.has(p.id)}
                          title={
                            !canSelect
                              ? "Exclu (DNC, archivé ou e-mail invalide)"
                              : undefined
                          }
                          onChange={() => toggleSelect(p.id)}
                        />
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        <strong>{p.company_name}</strong>
                        {p.do_not_contact && (
                          <span className="crm-badge crm-badge--danger">DNC</span>
                        )}
                        {!isValidEmailAddress(p.email) && (
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {" "}
                            sans e-mail
                          </span>
                        )}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {tradeLabel(p.trade_slug)}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {p.city || "—"}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {byId(refs.statuses, p.status_id)?.label ?? "—"}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {byId(refs.priorities, p.priority_id)?.label ?? "—"}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {next && !p.do_not_contact
                          ? `${next.title} · ${formatDateFr(next.due_at)}`
                          : "—"}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {formatDateFr(lastContactByProspect.get(p.id))}
                      </td>
                      <td onClick={() => navigate(`/admin/prospects/${p.id}`)}>
                        {byId(refs.sources, p.source_id)?.label ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {view === "kanban" && (
        <div className="crm-kanban">
          {kanbanStatuses.map((status) => {
            const cards = filtered.filter((p) => p.status_id === status.id);
            return (
              <section
                key={status.id}
                className="crm-kanban__col"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/prospect-id");
                  if (id) void moveStatus(id, status.id);
                }}
              >
                <header>
                  <h2>{status.label}</h2>
                  <span>{cards.length}</span>
                </header>
                <div className="crm-kanban__cards">
                  {cards.map((p) => (
                    <article
                      key={p.id}
                      className="crm-kanban__card"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/prospect-id", p.id);
                      }}
                    >
                      <Link to={`/admin/prospects/${p.id}`}>
                        <strong>{p.company_name}</strong>
                        <span className="text-muted">
                          {tradeLabel(p.trade_slug)}
                          {p.city ? ` · ${p.city}` : ""}
                        </span>
                        {nextTaskByProspect.get(p.id) && !p.do_not_contact && (
                          <span className="crm-kanban__next">
                            {nextTaskByProspect.get(p.id)!.title} ·{" "}
                            {formatDateFr(nextTaskByProspect.get(p.id)!.due_at)}
                          </span>
                        )}
                      </Link>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DueBlock({ title, items }: { title: string; items: TaskWithProspect[] }) {
  return (
    <div className="crm-due-block">
      <h3>
        {title} <span>{items.length}</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-muted">Aucune</p>
      ) : (
        <ul>
          {items.slice(0, 5).map((t) => (
            <li key={t.id}>
              <Link to={`/admin/prospects/${t.prospect_id}`}>
                {t.prospect?.company_name ?? "Prospect"}
              </Link>
              <span className="text-muted">
                {" "}
                · {t.title} · {formatDateFr(t.due_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
