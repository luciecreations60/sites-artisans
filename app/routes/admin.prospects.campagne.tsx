import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { trades } from "~/data/trades";
import type { Prospect } from "~/lib/crm.types";
import { formatDateFr } from "~/lib/portal";
import {
  appendFooterAndSignature,
  buildTemplateVars,
  isValidEmailAddress,
  recipientDisplayName,
  renderTemplate,
  textToSimpleHtml,
} from "~/lib/prospectEmail";
import { invokeProcessEmailQueue } from "~/lib/prospectEmailApi";
import type {
  CrmEmailSettings,
  ProspectEmail,
  ProspectEmailCampaign,
  ProspectEmailTemplate,
} from "~/lib/prospectEmail.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, LoadingState } from "~/components/portal/PortalUi";

export const meta = () => [{ title: "Campagne e-mail — Administration" }];

export default function AdminProspectCampaign() {
  const { campaignId } = useParams();
  const { refs, byId, byCode } = useCrmRefs();
  const [campaign, setCampaign] = useState<ProspectEmailCampaign | null>(null);
  const [emails, setEmails] = useState<ProspectEmail[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [settings, setSettings] = useState<CrmEmailSettings | null>(null);
  const [templates, setTemplates] = useState<ProspectEmailTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!campaignId) return;
    const sb = getSupabase();
    if (!sb) return;
    const [c, e, s, t] = await Promise.all([
      sb.from("prospect_email_campaigns").select("*").eq("id", campaignId).maybeSingle(),
      sb
        .from("prospect_emails")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at"),
      sb.from("crm_email_settings").select("*").limit(1).maybeSingle(),
      sb.from("prospect_email_templates").select("*").eq("is_active", true),
    ]);
    if (c.error) setError(c.error.message);
    setCampaign((c.data as ProspectEmailCampaign | null) ?? null);
    const emailRows = (e.data as ProspectEmail[]) ?? [];
    setEmails(emailRows);
    setSettings((s.data as CrmEmailSettings | null) ?? null);
    setTemplates((t.data as ProspectEmailTemplate[]) ?? []);

    const ids = [...new Set(emailRows.map((x) => x.prospect_id))];
    if (ids.length) {
      const { data: pros } = await sb.from("prospects").select("*").in("id", ids);
      setProspects((pros as Prospect[]) ?? []);
    } else setProspects([]);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const prospectMap = useMemo(
    () => new Map(prospects.map((p) => [p.id, p])),
    [prospects],
  );

  const counts = useMemo(() => {
    let ready = 0;
    let queued = 0;
    let sent = 0;
    let failed = 0;
    let cancelled = 0;
    let draft = 0;
    let noEmail = 0;
    for (const em of emails) {
      const code = byId(refs.emailStatuses, em.email_status_id)?.code;
      if (code === "ready") ready++;
      else if (code === "queued") queued++;
      else if (code === "sent") sent++;
      else if (code === "failed") failed++;
      else if (code === "cancelled") cancelled++;
      else if (code === "draft") draft++;
      if (!isValidEmailAddress(em.recipient_email)) noEmail++;
    }
    return { ready, queued, sent, failed, cancelled, draft, noEmail, total: emails.length };
  }, [emails, refs.emailStatuses, byId]);

  const campStatus = campaign
    ? byId(refs.campaignStatuses, campaign.status_id)?.code
    : undefined;

  async function setCampaignStatus(code: string, extra: Record<string, unknown> = {}) {
    const sb = getSupabase();
    const st = byCode(refs.campaignStatuses, code);
    if (!sb || !st || !campaign) return;
    const { error: err } = await sb
      .from("prospect_email_campaigns")
      .update({ status_id: st.id, ...extra })
      .eq("id", campaign.id);
    if (err) setError(err.message);
    else await reload();
  }

  async function generateDrafts() {
    const sb = getSupabase();
    if (!sb || !campaign || !settings) return;
    setBusy(true);
    setError(null);
    const draftSt = byCode(refs.emailStatuses, "draft");
    const type = byCode(refs.emailTypes, "first_contact");
    const tpl =
      templates.find((t) => t.email_type_id === type?.id && t.is_default) ??
      templates.find((t) => t.email_type_id === type?.id);
    if (!draftSt || !type || !tpl) {
      setError("Type / modèle first_contact manquant.");
      setBusy(false);
      return;
    }

    for (const em of emails) {
      const code = byId(refs.emailStatuses, em.email_status_id)?.code;
      if (code !== "draft" && code !== "ready") continue;
      const prospect = prospectMap.get(em.prospect_id);
      if (!prospect) continue;
      const vars = buildTemplateVars({
        prospect,
        settings,
        origin: window.location.origin,
      });
      let subject = renderTemplate(tpl.subject_template, vars);
      let body = appendFooterAndSignature(
        renderTemplate(tpl.body_template, vars),
        settings,
      );
      await sb
        .from("prospect_emails")
        .update({
          email_type_id: type.id,
          template_id: tpl.id,
          subject,
          body_text: body,
          body_html: textToSimpleHtml(body),
          recipient_email: (em.recipient_email || prospect.email || "").trim(),
          recipient_name: recipientDisplayName(prospect),
          email_status_id: draftSt.id,
        })
        .eq("id", em.id);
    }
    await setCampaignStatus("ready");
    setOk("Brouillons personnalisés générés.");
    setBusy(false);
    await reload();
  }

  async function removeEmail(emailId: string) {
    const sb = getSupabase();
    if (!sb) return;
    const code = byId(
      refs.emailStatuses,
      emails.find((e) => e.id === emailId)?.email_status_id ?? "",
    )?.code;
    if (code === "sent" || code === "sending") {
      setError("Impossible de retirer un e-mail déjà envoyé / en cours.");
      return;
    }
    await sb.from("prospect_emails").delete().eq("id", emailId);
    await reload();
  }

  async function launch() {
    const sb = getSupabase();
    if (!sb || !campaign) return;
    const eligible = emails.filter((em) => {
      const code = byId(refs.emailStatuses, em.email_status_id)?.code;
      const p = prospectMap.get(em.prospect_id);
      return (
        (code === "draft" || code === "ready") &&
        isValidEmailAddress(em.recipient_email) &&
        p &&
        !p.do_not_contact &&
        !p.archived_at
      );
    });
    if (!eligible.length) {
      setError("Aucun destinataire éligible.");
      return;
    }
    if (
      !window.confirm(
        `${eligible.length} emails personnalisés seront placés dans la file d’envoi.`,
      )
    ) {
      return;
    }
    setBusy(true);
    const queued = byCode(refs.emailStatuses, "queued");
    const running = byCode(refs.campaignStatuses, "running");
    if (!queued || !running) {
      setError("Référentiels manquants.");
      setBusy(false);
      return;
    }
    const now = new Date().toISOString();
    for (const em of eligible) {
      await sb
        .from("prospect_emails")
        .update({
          email_status_id: queued.id,
          queued_at: now,
          ready_at: em.ready_at ?? now,
        })
        .eq("id", em.id);
    }
    // Exclure sans email / DNC → cancelled
    const cancelled = byCode(refs.emailStatuses, "cancelled");
    if (cancelled) {
      for (const em of emails) {
        if (eligible.some((x) => x.id === em.id)) continue;
        const code = byId(refs.emailStatuses, em.email_status_id)?.code;
        if (code === "sent" || code === "queued" || code === "sending") continue;
        const p = prospectMap.get(em.prospect_id);
        const reason = p?.do_not_contact
          ? "Ne plus contacter"
          : !isValidEmailAddress(em.recipient_email)
            ? "Sans e-mail valide"
            : p?.archived_at
              ? "Archivé"
              : null;
        if (reason) {
          await sb
            .from("prospect_emails")
            .update({
              email_status_id: cancelled.id,
              failure_reason: reason,
            })
            .eq("id", em.id);
        }
      }
    }
    await sb
      .from("prospect_email_campaigns")
      .update({
        status_id: running.id,
        started_at: campaign.started_at ?? now,
      })
      .eq("id", campaign.id);
    setOk(
      "File créée en base. Les envois progressent via le worker serveur (cron) — pas besoin de garder l’Admin ouvert.",
    );
    setBusy(false);
    await reload();
  }

  async function pause() {
    await setCampaignStatus("paused");
    setOk("Campagne en pause — aucun nouvel envoi depuis la file.");
  }

  async function resume() {
    await setCampaignStatus("running");
    setOk("Campagne reprise.");
  }

  async function cancelRemaining() {
    const sb = getSupabase();
    if (!sb || !campaign) return;
    if (!window.confirm("Annuler les envois restants ? Les messages déjà envoyés restent.")) {
      return;
    }
    const cancelled = byCode(refs.emailStatuses, "cancelled");
    const campCancel = byCode(refs.campaignStatuses, "cancelled");
    if (!cancelled || !campCancel) return;
    for (const em of emails) {
      const code = byId(refs.emailStatuses, em.email_status_id)?.code;
      if (code === "queued" || code === "ready" || code === "draft") {
        await sb
          .from("prospect_emails")
          .update({ email_status_id: cancelled.id, failure_reason: "Campagne annulée" })
          .eq("id", em.id);
      }
    }
    await sb
      .from("prospect_email_campaigns")
      .update({ status_id: campCancel.id, completed_at: new Date().toISOString() })
      .eq("id", campaign.id);
    setOk("Envois restants annulés.");
    await reload();
  }

  async function retryFailed() {
    const sb = getSupabase();
    const queued = byCode(refs.emailStatuses, "queued");
    const running = byCode(refs.campaignStatuses, "running");
    if (!sb || !queued || !campaign) return;
    const now = new Date().toISOString();
    for (const em of emails) {
      if (byId(refs.emailStatuses, em.email_status_id)?.code !== "failed") continue;
      await sb
        .from("prospect_emails")
        .update({
          email_status_id: queued.id,
          queued_at: now,
          failure_reason: null,
          failed_at: null,
        })
        .eq("id", em.id);
    }
    if (campStatus !== "running" && running) {
      await sb
        .from("prospect_email_campaigns")
        .update({ status_id: running.id, completed_at: null })
        .eq("id", campaign.id);
    }
    setOk("Échecs remis en file.");
    await reload();
  }

  async function processOne() {
    setBusy(true);
    const res = await invokeProcessEmailQueue();
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Erreur worker");
    else {
      setOk(
        res.processed
          ? `1 e-mail traité (${res.message ?? "ok"}).`
          : res.message ?? "Rien à traiter (limites ou file vide).",
      );
      await reload();
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <LoadingState label="Chargement campagne…" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="admin-page">
        <ErrorState message="Campagne introuvable." />
        <Link to="/admin/prospects">← Prospects</Link>
      </div>
    );
  }

  const tradeLabel = campaign.trade_slug
    ? trades[campaign.trade_slug as keyof typeof trades]?.label ?? campaign.trade_slug
    : "—";

  return (
    <div className="admin-page">
      <p>
        <Link to="/admin/prospects">← Prospects</Link>
        {" · "}
        <Link to="/admin/prospects/campagnes">Toutes les campagnes</Link>
      </p>
      <header className="admin-page__header">
        <h1>{campaign.name}</h1>
        <p className="text-muted">
          {tradeLabel}
          {" · "}
          {byId(refs.campaignStatuses, campaign.status_id)?.label ?? "—"}
          {" · "}
          {counts.sent} / {counts.total} envoyés
        </p>
      </header>

      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}

      <div className="crm-summary-grid" style={{ marginBottom: "1rem" }}>
        <p>
          <strong>{counts.total}</strong> destinataires
        </p>
        <p>
          <strong>{counts.draft + counts.ready}</strong> prêts / brouillons
        </p>
        <p>
          <strong>{counts.queued}</strong> en file
        </p>
        <p>
          <strong>{counts.sent}</strong> envoyés
        </p>
        <p>
          <strong>{counts.failed}</strong> échecs
        </p>
        <p>
          <strong>{counts.cancelled + counts.noEmail}</strong> exclus / annulés
        </p>
      </div>

      <div className="crm-header-actions" style={{ marginBottom: "1.25rem" }}>
        {(campStatus === "draft" || campStatus === "ready") && (
          <>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void generateDrafts()}
            >
              Générer les brouillons
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => void launch()}
            >
              Lancer les envois
            </button>
          </>
        )}
        {campStatus === "running" && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => void pause()}>
              Mettre en pause
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void processOne()}
              title="Traite 1 e-mail maintenant (test) — le cron serveur fait le reste"
            >
              Traiter 1 (manuel)
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void cancelRemaining()}>
              Annuler les restants
            </button>
          </>
        )}
        {campStatus === "paused" && (
          <>
            <button type="button" className="btn btn-primary" onClick={() => void resume()}>
              Reprendre
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void cancelRemaining()}>
              Annuler les restants
            </button>
          </>
        )}
        {counts.failed > 0 && (campStatus === "running" || campStatus === "completed" || campStatus === "paused") && (
          <button type="button" className="btn btn-ghost" onClick={() => void retryFailed()}>
            Réessayer les échecs
          </button>
        )}
      </div>

      <p className="text-muted" style={{ fontSize: "0.9rem" }}>
        File persistante en base (<code>queued</code>). Aucun timer navigateur : fermer l’Admin
        n’interrompt pas la campagne si le cron Edge est configuré (voir{" "}
        <code>supabase/EMAIL.md</code>).
      </p>

      <div className="admin-table-wrap">
        <table className="admin-table crm-table">
          <thead>
            <tr>
              <th>Prospect</th>
              <th>Destinataire</th>
              <th>Objet</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {emails.map((em) => {
              const p = prospectMap.get(em.prospect_id);
              const st = byId(refs.emailStatuses, em.email_status_id);
              return (
                <tr key={em.id}>
                  <td>
                    {p ? (
                      <Link to={`/admin/prospects/${p.id}`}>{p.company_name}</Link>
                    ) : (
                      "—"
                    )}
                    {p?.do_not_contact ? (
                      <span className="crm-badge crm-badge--danger">DNC</span>
                    ) : null}
                  </td>
                  <td>{em.recipient_email || "—"}</td>
                  <td>{em.subject || "(vide)"}</td>
                  <td>
                    {st?.label ?? "—"}
                    {em.failure_reason ? (
                      <span className="text-muted" style={{ display: "block", fontSize: "0.8rem" }}>
                        {em.failure_reason}
                      </span>
                    ) : null}
                    {em.sent_at ? (
                      <span className="text-muted" style={{ display: "block", fontSize: "0.8rem" }}>
                        {formatDateFr(em.sent_at)}
                      </span>
                    ) : null}
                  </td>
                  <td>
                    {(st?.code === "draft" || st?.code === "ready" || st?.code === "queued") && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void removeEmail(em.id)}
                      >
                        Retirer
                      </button>
                    )}
                    {p && (
                      <Link
                        className="btn btn-ghost"
                        to={`/admin/prospects/${p.id}#emails`}
                      >
                        Éditer
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
