import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { slugifyCode } from "~/lib/crm";
import type {
  CrmRef,
  ProspectDemoStatusRef,
  ProspectEmailCampaignStatusRef,
  ProspectEmailStatusRef,
  ProspectEmailTypeRef,
  ProspectInteractionType,
  ProspectStatus,
} from "~/lib/crm.types";
import { invokeTestEmailProvider } from "~/lib/prospectEmailApi";
import type { CrmEmailSettings } from "~/lib/prospectEmail.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";

export const meta = () => [{ title: "Paramètres CRM — Administration" }];

type RefKey =
  | "statuses"
  | "sources"
  | "priorities"
  | "taskTypes"
  | "interactionTypes"
  | "dncReasons"
  | "tags"
  | "demoStatuses"
  | "emailTypes"
  | "emailStatuses"
  | "campaignStatuses"
  | "emailConfig";

const TABS: { key: RefKey; table: string; label: string }[] = [
  { key: "statuses", table: "prospect_statuses", label: "Statuts" },
  { key: "sources", table: "prospect_sources", label: "Sources" },
  { key: "priorities", table: "prospect_priorities", label: "Priorités" },
  { key: "taskTypes", table: "prospect_task_types", label: "Types de tâches" },
  {
    key: "interactionTypes",
    table: "prospect_interaction_types",
    label: "Types d’interactions",
  },
  {
    key: "dncReasons",
    table: "prospect_do_not_contact_reasons",
    label: "Motifs ne plus contacter",
  },
  { key: "tags", table: "prospect_tags", label: "Tags" },
  {
    key: "demoStatuses",
    table: "prospect_demo_statuses",
    label: "Statuts de démo",
  },
  { key: "emailTypes", table: "prospect_email_types", label: "Types d’e-mail" },
  {
    key: "emailStatuses",
    table: "prospect_email_statuses",
    label: "Statuts d’e-mail",
  },
  {
    key: "campaignStatuses",
    table: "prospect_email_campaign_statuses",
    label: "Statuts campagne",
  },
  { key: "emailConfig", table: "", label: "Config e-mail" },
];

export default function AdminProspectsParametres() {
  const { refs, loading, error, reload } = useCrmRefs();
  const [tab, setTab] = useState<RefKey>("statuses");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newCode, setNewCode] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [emailSettings, setEmailSettings] = useState<CrmEmailSettings | null>(null);
  const [providerState, setProviderState] = useState<string>("—");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb
      .from("crm_email_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setEmailSettings((data as CrmEmailSettings | null) ?? null));
  }, [tab]);

  const current = useMemo(() => {
    if (tab === "emailConfig") return [];
    const list = refs[tab as Exclude<RefKey, "emailConfig">] as CrmRef[];
    return [...(list ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  }, [refs, tab]);

  const table = TABS.find((t) => t.key === tab)!.table;

  async function updateRow(id: string, patch: Record<string, unknown>) {
    const sb = getSupabase();
    if (!sb || !table) return;
    setErr(null);
    const { error: e } = await sb.from(table).update(patch).eq("id", id);
    if (e) setErr(e.message);
    else {
      setMsg("Enregistré.");
      await reload();
    }
  }

  async function addRow(e: FormEvent) {
    e.preventDefault();
    if (tab === "emailConfig" || !table) return;
    const sb = getSupabase();
    if (!sb) return;
    const label = newLabel.trim();
    const code = (newCode.trim() || slugifyCode(label)).slice(0, 64);
    if (!label || !code) return;
    setErr(null);
    const maxOrder = current.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const payload: Record<string, unknown> = {
      code,
      label,
      sort_order: maxOrder + 10,
      is_active: true,
    };
    if (tab === "statuses") {
      payload.is_closed = false;
      payload.is_won = false;
    }
    if (tab === "interactionTypes") {
      payload.is_system = false;
      payload.counts_as_contact = false;
    }
    if (
      tab === "demoStatuses" ||
      tab === "emailTypes" ||
      tab === "emailStatuses" ||
      tab === "campaignStatuses"
    ) {
      payload.is_system = false;
    }
    const { error: e2 } = await sb.from(table).insert(payload);
    if (e2) setErr(e2.message);
    else {
      setNewLabel("");
      setNewCode("");
      setMsg("Valeur ajoutée.");
      await reload();
    }
  }

  async function move(row: CrmRef, dir: -1 | 1) {
    const idx = current.findIndex((r) => r.id === row.id);
    const other = current[idx + dir];
    if (!other) return;
    await updateRow(row.id, { sort_order: other.sort_order });
    await updateRow(other.id, { sort_order: row.sort_order });
  }

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <p>
        <Link to="/admin/prospects">← Prospects</Link>
      </p>
      <header className="admin-page__header">
        <h1>Paramètres CRM</h1>
        <p className="text-muted">
          Référentiels administrables. Le code technique est stable et non renommable.
        </p>
      </header>

      {(error || err) && <ErrorState message={error || err || ""} />}
      {msg && <p className="portal-success">{msg}</p>}

      <div className="crm-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={tab === t.key ? "is-active" : undefined}
            onClick={() => {
              setTab(t.key);
              setMsg(null);
              setShowAdvanced(false);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "emailConfig" && (
      <form className="stack-form admin-upload-form" onSubmit={addRow}>
        <h2 className="portal-subhead" style={{ marginTop: 0 }}>
          Ajouter une valeur
        </h2>
        <label>
          Libellé
          <input
            required
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              if (!newCode) setNewCode(slugifyCode(e.target.value));
            }}
          />
        </label>
        <label>
          Code technique (unique, non modifiable ensuite)
          <input
            required
            value={newCode}
            onChange={(e) => setNewCode(slugifyCode(e.target.value))}
            pattern="[a-z0-9_]+"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Ajouter
        </button>
      </form>
      )}

      {tab === "emailConfig" && emailSettings && (
        <EmailConfigForm
          settings={emailSettings}
          providerState={providerState}
          onSaved={async () => {
            setMsg("Configuration e-mail enregistrée.");
            const sb = getSupabase();
            if (!sb) return;
            const { data } = await sb
              .from("crm_email_settings")
              .select("*")
              .limit(1)
              .maybeSingle();
            setEmailSettings((data as CrmEmailSettings | null) ?? null);
          }}
          onTest={async () => {
            const res = await invokeTestEmailProvider();
            if (!res.ok) {
              setErr(res.error ?? "Test impossible");
              setProviderState("Erreur");
              return;
            }
            setProviderState(
              res.configured
                ? `Configuré (${res.provider_code}) — ${res.test?.message ?? ""}`
                : `Non configuré (${res.provider_code})`,
            );
            setMsg(res.test?.message ?? "Test effectué.");
          }}
          onError={setErr}
        />
      )}

      {tab !== "emailConfig" && (
      <div className="admin-table-wrap">
        <table className="admin-table crm-ref-table">
          <thead>
            <tr>
              <th>Ordre</th>
              <th>Code</th>
              <th>Libellé</th>
              <th>Actif</th>
              {tab === "interactionTypes" && <th>Compte comme contact</th>}
              {tab === "statuses" && showAdvanced && (
                <>
                  <th>Fermé</th>
                  <th>Gagné</th>
                </>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {current.map((row) => {
              const asStatus = row as ProspectStatus;
              const asIx = row as ProspectInteractionType;
              const asDemo = row as ProspectDemoStatusRef;
              const asEmailSys = row as
                | ProspectEmailTypeRef
                | ProspectEmailStatusRef
                | ProspectEmailCampaignStatusRef;
              const systemLocked =
                (tab === "interactionTypes" && (asIx.is_system || false)) ||
                (tab === "demoStatuses" && (asDemo.is_system || false)) ||
                ((tab === "emailTypes" ||
                  tab === "emailStatuses" ||
                  tab === "campaignStatuses") &&
                  (asEmailSys.is_system || false));
              return (
                <tr key={row.id}>
                  <td>
                    <div className="crm-order-btns">
                      <button type="button" className="btn btn-ghost" onClick={() => void move(row, -1)}>
                        ↑
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => void move(row, 1)}>
                        ↓
                      </button>
                    </div>
                  </td>
                  <td>
                    <code>{row.code}</code>
                    {tab === "demoStatuses" && systemLocked ? (
                      <span className="text-muted" style={{ display: "block", fontSize: "0.75rem" }}>
                        code protégé
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <input
                      className="crm-inline-input"
                      defaultValue={row.label}
                      key={`${row.id}-${row.label}`}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v && v !== row.label) void updateRow(row.id, { label: v });
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={row.is_active}
                      disabled={systemLocked}
                      title={
                        systemLocked
                          ? "Valeur système — désactivation bloquée"
                          : undefined
                      }
                      onChange={(e) =>
                        void updateRow(row.id, { is_active: e.target.checked })
                      }
                    />
                  </td>
                  {tab === "interactionTypes" && (
                    <td>
                      <input
                        type="checkbox"
                        checked={Boolean(asIx.counts_as_contact)}
                        onChange={(e) =>
                          void updateRow(row.id, {
                            counts_as_contact: e.target.checked,
                          })
                        }
                      />
                    </td>
                  )}
                  {tab === "statuses" && showAdvanced && (
                    <>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(asStatus.is_closed)}
                          onChange={(e) =>
                            void updateRow(row.id, { is_closed: e.target.checked })
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(asStatus.is_won)}
                          onChange={(e) =>
                            void updateRow(row.id, { is_won: e.target.checked })
                          }
                        />
                      </td>
                    </>
                  )}
                  <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                    {systemLocked ? "Système" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {tab === "statuses" && (
        <details
          className="crm-advanced"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary>Options avancées — propriétés métier des statuts (is_closed / is_won)</summary>
          <p className="text-muted">
            Ces propriétés pilotent le Kanban (statuts fermés) et la notion de « gagné ».
            Ne les modifiez que si vous savez pourquoi.
          </p>
        </details>
      )}

      {tab === "demoStatuses" && (
        <p className="text-muted" style={{ marginTop: "1rem" }}>
          Les codes système <code>draft</code>, <code>ready</code>, <code>published</code>,{" "}
          <code>shared</code>, <code>disabled</code> pilotent l’accès public. Seuls le libellé et
          l’ordre sont modifiables — jamais le code.
        </p>
      )}
    </div>
  );
}

function EmailConfigForm({
  settings,
  providerState,
  onSaved,
  onTest,
  onError,
}: {
  settings: CrmEmailSettings;
  providerState: string;
  onSaved: () => void | Promise<void>;
  onTest: () => void | Promise<void>;
  onError: (m: string) => void;
}) {
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const { error } = await sb
      .from("crm_email_settings")
      .update({
        provider_code: String(fd.get("provider_code") || "ovh_smtp"),
        sender_name: String(fd.get("sender_name") || "").trim(),
        sender_company: String(fd.get("sender_company") || "").trim(),
        sender_email: String(fd.get("sender_email") || "").trim(),
        sender_phone: String(fd.get("sender_phone") || "").trim() || null,
        sender_website: String(fd.get("sender_website") || "").trim() || null,
        reply_to: String(fd.get("reply_to") || "").trim() || null,
        email_footer: String(fd.get("email_footer") || "").trim() || null,
        default_first_follow_up_days: Number(fd.get("default_first_follow_up_days") || 5),
        default_second_follow_up_days: Number(fd.get("default_second_follow_up_days") || 10),
        max_emails_per_day: Number(fd.get("max_emails_per_day") || 50),
        max_emails_per_hour: Number(fd.get("max_emails_per_hour") || 10),
        default_campaign_max_recipients: Number(
          fd.get("default_campaign_max_recipients") || 50,
        ),
      })
      .eq("id", settings.id);
    if (error) onError(error.message);
    else await onSaved();
  }

  return (
    <form className="stack-form admin-upload-form" onSubmit={(e) => void save(e)}>
      <h2 className="portal-subhead" style={{ marginTop: 0 }}>
        Signature & limites
      </h2>
      <p className="text-muted">
        Les secrets SMTP ne sont jamais stockés ici — uniquement en secrets Edge Functions.
        Voir <code>supabase/EMAIL.md</code>.
      </p>
      <p>
        Fournisseur : <strong>{providerState}</strong>
      </p>
      <button type="button" className="btn btn-ghost" onClick={() => void onTest()}>
        Tester la configuration (serveur)
      </button>
      <label>
        provider_code
        <input name="provider_code" defaultValue={settings.provider_code} />
      </label>
      <label>
        Nom expéditeur
        <input name="sender_name" required defaultValue={settings.sender_name} />
      </label>
      <label>
        Société
        <input name="sender_company" required defaultValue={settings.sender_company} />
      </label>
      <label>
        E-mail affiché
        <input name="sender_email" defaultValue={settings.sender_email} />
      </label>
      <label>
        Téléphone
        <input name="sender_phone" defaultValue={settings.sender_phone ?? ""} />
      </label>
      <label>
        Site
        <input name="sender_website" defaultValue={settings.sender_website ?? ""} />
      </label>
      <label>
        Reply-To
        <input name="reply_to" defaultValue={settings.reply_to ?? ""} />
      </label>
      <label>
        Footer prospection
        <textarea name="email_footer" rows={3} defaultValue={settings.email_footer ?? ""} />
      </label>
      <div className="crm-summary-grid">
        <label>
          Relance 1 (jours)
          <input
            type="number"
            name="default_first_follow_up_days"
            min={1}
            defaultValue={settings.default_first_follow_up_days}
          />
        </label>
        <label>
          Relance 2 (jours)
          <input
            type="number"
            name="default_second_follow_up_days"
            min={1}
            defaultValue={settings.default_second_follow_up_days}
          />
        </label>
        <label>
          Max e-mails / jour
          <input
            type="number"
            name="max_emails_per_day"
            min={1}
            defaultValue={settings.max_emails_per_day}
          />
        </label>
        <label>
          Max e-mails / heure
          <input
            type="number"
            name="max_emails_per_hour"
            min={1}
            defaultValue={settings.max_emails_per_hour}
          />
        </label>
        <label>
          Max destinataires / campagne
          <input
            type="number"
            name="default_campaign_max_recipients"
            min={1}
            defaultValue={settings.default_campaign_max_recipients}
          />
        </label>
      </div>
      <button type="submit" className="btn btn-primary">
        Enregistrer
      </button>
    </form>
  );
}
