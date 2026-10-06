import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
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
import { invokeSendProspectEmail } from "~/lib/prospectEmailApi";
import type {
  CrmEmailSettings,
  ProspectEmail,
  ProspectEmailTemplate,
} from "~/lib/prospectEmail.types";
import { isProspectDemoPubliclyAccessible } from "~/lib/prospectDemo";
import type { ProspectDemo } from "~/lib/prospectDemo.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, PortalSection } from "~/components/portal/PortalUi";

type Props = {
  prospect: Prospect;
  onChanged?: () => void;
};

export function ProspectEmailsPanel({ prospect, onChanged }: Props) {
  const { refs, byId, byCode } = useCrmRefs();
  const [emails, setEmails] = useState<ProspectEmail[]>([]);
  const [templates, setTemplates] = useState<ProspectEmailTemplate[]>([]);
  const [demos, setDemos] = useState<ProspectDemo[]>([]);
  const [settings, setSettings] = useState<CrmEmailSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<ProspectEmail | null>(null);
  const [preview, setPreview] = useState<ProspectEmail | null>(null);
  const [suggestFollowUp, setSuggestFollowUp] = useState(false);
  const [sending, setSending] = useState(false);

  // Compose form
  const [typeId, setTypeId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [demoId, setDemoId] = useState("");
  const [recipient, setRecipient] = useState(prospect.email ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  async function reload() {
    const sb = getSupabase();
    if (!sb) return;
    const [e, t, d, s] = await Promise.all([
      sb
        .from("prospect_emails")
        .select("*")
        .eq("prospect_id", prospect.id)
        .order("created_at", { ascending: false }),
      sb.from("prospect_email_templates").select("*").eq("is_active", true),
      sb.from("prospect_demos").select("*").eq("prospect_id", prospect.id),
      sb.from("crm_email_settings").select("*").limit(1).maybeSingle(),
    ]);
    if (e.error) setError(e.error.message);
    setEmails((e.data as ProspectEmail[]) ?? []);
    setTemplates((t.data as ProspectEmailTemplate[]) ?? []);
    setDemos((d.data as ProspectDemo[]) ?? []);
    setSettings((s.data as CrmEmailSettings | null) ?? null);
  }

  useEffect(() => {
    void reload();
    setRecipient(prospect.email ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id, prospect.email]);

  const publicDemos = useMemo(() => {
    return demos.filter((d) => {
      const st = byId(refs.demoStatuses, d.status_id);
      return isProspectDemoPubliclyAccessible(d, st);
    });
  }, [demos, refs.demoStatuses, byId]);

  const typeTemplates = useMemo(
    () => templates.filter((t) => t.email_type_id === typeId),
    [templates, typeId],
  );

  function applyTemplate(tpl: ProspectEmailTemplate | undefined, demo?: ProspectDemo | null) {
    if (!tpl || !settings) return;
    const vars = buildTemplateVars({
      prospect,
      settings,
      demoPublicSlug: demo?.public_slug,
      origin: typeof window !== "undefined" ? window.location.origin : "",
    });
    let subj = renderTemplate(tpl.subject_template, vars);
    let bod = renderTemplate(tpl.body_template, vars);
    bod = appendFooterAndSignature(bod, settings);
    setSubject(subj);
    setBody(bod);
  }

  function startCompose() {
    setComposing(true);
    setEditing(null);
    setOk(null);
    const first = byCode(refs.emailTypes, "first_contact") ?? refs.emailTypes[0];
    setTypeId(first?.id ?? "");
    setRecipient(prospect.email ?? "");
    const primary = publicDemos.find((d) => d.is_primary) ?? publicDemos[0];
    setDemoId(primary?.id ?? "");
    setTemplateId("");
    setSubject("");
    setBody("");
  }

  useEffect(() => {
    if (!composing || !typeId) return;
    const def =
      typeTemplates.find((t) => t.is_default) ?? typeTemplates[0];
    setTemplateId(def?.id ?? "");
    const demo = demos.find((d) => d.id === demoId) ?? null;
    if (def) applyTemplate(def, demo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId, composing]);

  async function saveDraft(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb || !settings) return;
    setError(null);
    const draftStatus = byCode(refs.emailStatuses, "draft");
    if (!draftStatus) {
      setError("Statuts e-mail manquants — exécutez la migration Phase 3.");
      return;
    }
    if (demoId) {
      const demo = demos.find((d) => d.id === demoId);
      const st = demo ? byId(refs.demoStatuses, demo.status_id) : undefined;
      if (!demo || !isProspectDemoPubliclyAccessible(demo, st)) {
        setError("Publiez d’abord la démo pour pouvoir transmettre son lien.");
        return;
      }
    }
    const payload = {
      prospect_id: prospect.id,
      email_type_id: typeId,
      email_status_id: draftStatus.id,
      template_id: templateId || null,
      demo_id: demoId || null,
      recipient_email: recipient.trim(),
      recipient_name: recipientDisplayName(prospect),
      subject: subject.trim(),
      body_text: body.trim(),
      body_html: textToSimpleHtml(body.trim()),
    };
    if (editing) {
      if (byId(refs.emailStatuses, editing.email_status_id)?.code === "sent") {
        setError("E-mail envoyé — immutable. Dupliquez pour une nouvelle version.");
        return;
      }
      const { error: uErr } = await sb.from("prospect_emails").update(payload).eq("id", editing.id);
      if (uErr) setError(uErr.message);
      else {
        setOk("Brouillon enregistré.");
        setComposing(false);
        setEditing(null);
        await reload();
        onChanged?.();
      }
      return;
    }
    const { error: iErr } = await sb.from("prospect_emails").insert(payload);
    if (iErr) setError(iErr.message);
    else {
      setOk("Brouillon créé.");
      setComposing(false);
      await reload();
      onChanged?.();
    }
  }

  async function markReady(email: ProspectEmail) {
    const sb = getSupabase();
    const ready = byCode(refs.emailStatuses, "ready");
    if (!sb || !ready) return;
    await sb
      .from("prospect_emails")
      .update({ email_status_id: ready.id, ready_at: new Date().toISOString() })
      .eq("id", email.id);
    await reload();
  }

  async function sendEmail(email: ProspectEmail) {
    if (prospect.do_not_contact) {
      setError("Ne plus contacter — envoi bloqué.");
      return;
    }
    if (!isValidEmailAddress(email.recipient_email)) {
      setError("Adresse destinataire invalide.");
      return;
    }
    if (
      !window.confirm(
        `Envoyer cet e-mail à ${email.recipient_email} ?`,
      )
    ) {
      return;
    }
    setSending(true);
    setError(null);
    // Marquer ready si draft
    const code = byId(refs.emailStatuses, email.email_status_id)?.code;
    if (code === "draft") await markReady(email);
    const res = await invokeSendProspectEmail(email.id);
    setSending(false);
    if (!res.ok) {
      setError(res.error ?? "Échec envoi");
      await reload();
      return;
    }
    setOk("E-mail envoyé.");
    setPreview(null);
    setSuggestFollowUp(Boolean(res.suggest_follow_up));
    await reload();
    onChanged?.();
  }

  async function scheduleFollowUp() {
    const sb = getSupabase();
    if (!sb || !settings) return;
    const follow = byCode(refs.taskTypes, "follow_up");
    if (!follow) {
      setError("Type de tâche follow_up introuvable.");
      return;
    }
    const due = new Date();
    due.setDate(due.getDate() + (settings.default_first_follow_up_days || 5));
    const { error: tErr } = await sb.from("prospect_tasks").insert({
      prospect_id: prospect.id,
      task_type_id: follow.id,
      title: "Relance e-mail",
      due_at: due.toISOString(),
    });
    if (tErr) setError(tErr.message);
    else {
      setOk("Tâche de relance créée.");
      setSuggestFollowUp(false);
      onChanged?.();
    }
  }

  function openEdit(email: ProspectEmail) {
    const code = byId(refs.emailStatuses, email.email_status_id)?.code;
    if (code === "sent" || code === "sending" || code === "queued") {
      setPreview(email);
      return;
    }
    setEditing(email);
    setComposing(true);
    setTypeId(email.email_type_id);
    setTemplateId(email.template_id ?? "");
    setDemoId(email.demo_id ?? "");
    setRecipient(email.recipient_email);
    setSubject(email.subject);
    setBody(email.body_text);
  }

  async function duplicate(email: ProspectEmail) {
    const sb = getSupabase();
    const draft = byCode(refs.emailStatuses, "draft");
    if (!sb || !draft) return;
    const { error: dErr } = await sb.from("prospect_emails").insert({
      prospect_id: prospect.id,
      campaign_id: null,
      email_type_id: email.email_type_id,
      email_status_id: draft.id,
      template_id: email.template_id,
      demo_id: email.demo_id,
      recipient_email: email.recipient_email,
      recipient_name: email.recipient_name,
      subject: email.subject,
      body_text: email.body_text,
      body_html: email.body_html,
    });
    if (dErr) setError(dErr.message);
    else {
      setOk("Brouillon dupliqué.");
      await reload();
    }
  }

  return (
    <PortalSection title="E-mails">
      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}
      {prospect.do_not_contact && (
        <p className="text-muted">Ne plus contacter — l’envoi est bloqué (brouillons possibles).</p>
      )}

      <div className="crm-header-actions" style={{ marginBottom: "1rem" }}>
        <button type="button" className="btn btn-primary" onClick={startCompose}>
          {composing ? "Nouveau brouillon" : "Préparer un e-mail"}
        </button>
      </div>

      {suggestFollowUp && (
        <div className="crm-dupe-alert" style={{ marginBottom: "1rem" }}>
          <p>Planifier une relance ?</p>
          <button type="button" className="btn btn-primary" onClick={() => void scheduleFollowUp()}>
            Créer une tâche de relance
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setSuggestFollowUp(false)}>
            Plus tard
          </button>
        </div>
      )}

      {composing && (
        <form className="stack-form admin-upload-form" onSubmit={(e) => void saveDraft(e)}>
          <label>
            Type
            <select
              required
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              {refs.emailTypes.filter((t) => t.is_active).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Modèle
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                const tpl = templates.find((t) => t.id === e.target.value);
                const demo = demos.find((d) => d.id === demoId) ?? null;
                applyTemplate(tpl, demo);
              }}
            >
              <option value="">—</option>
              {typeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Démo liée
            <select
              value={demoId}
              onChange={(e) => {
                setDemoId(e.target.value);
                const tpl = templates.find((t) => t.id === templateId);
                const demo = demos.find((d) => d.id === e.target.value) ?? null;
                if (tpl) applyTemplate(tpl, demo);
              }}
            >
              <option value="">Aucune</option>
              {publicDemos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.public_slug}
                  {d.is_primary ? " (principale)" : ""}
                </option>
              ))}
            </select>
          </label>
          {demos.length > 0 && publicDemos.length === 0 && (
            <p className="text-muted">
              Publiez d’abord la démo pour pouvoir transmettre son lien.
            </p>
          )}
          <label>
            Destinataire
            <input
              required
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </label>
          <label>
            Objet
            <input required value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label>
            Message
            <textarea
              required
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <div className="crm-header-actions">
            <button type="submit" className="btn btn-primary">
              Enregistrer le brouillon
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setComposing(false);
                setEditing(null);
              }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {preview && (
        <div className="crm-demo-card" style={{ marginBottom: "1rem" }}>
          <h3 className="portal-subhead">Prévisualisation</h3>
          <p>
            <strong>De :</strong> {settings?.sender_name} &lt;{settings?.sender_email || "…"}&gt;
          </p>
          <p>
            <strong>À :</strong> {preview.recipient_email}
          </p>
          <p>
            <strong>Objet :</strong> {preview.subject}
          </p>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{preview.body_text}</pre>
          <div className="crm-header-actions">
            {byId(refs.emailStatuses, preview.email_status_id)?.code !== "sent" && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    openEdit(preview);
                    setPreview(null);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={sending || prospect.do_not_contact}
                  onClick={() => void sendEmail(preview)}
                >
                  Envoyer
                </button>
              </>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setPreview(null)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      <ul className="crm-demo-list">
        {emails.map((email) => {
          const st = byId(refs.emailStatuses, email.email_status_id);
          const ty = byId(refs.emailTypes, email.email_type_id);
          return (
            <li key={email.id} className="crm-demo-card">
              <div className="crm-demo-card__head">
                <div>
                  <strong>{ty?.label ?? "E-mail"}</strong>
                  {" · "}
                  {st?.label ?? "—"}
                  <p className="text-muted" style={{ margin: "0.2rem 0 0" }}>
                    {email.subject || "(sans objet)"}
                  </p>
                  <p className="text-muted" style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    {email.recipient_email || "—"}
                    {email.sent_at ? ` · ${formatDateFr(email.sent_at)}` : ""}
                    {email.campaign_id ? (
                      <>
                        {" · "}
                        <Link to={`/admin/prospects/campagnes/${email.campaign_id}`}>
                          Campagne
                        </Link>
                      </>
                    ) : null}
                    {email.failure_reason ? ` · ${email.failure_reason}` : ""}
                  </p>
                </div>
                <div className="crm-header-actions">
                  {(st?.code === "draft" || st?.code === "ready" || st?.code === "failed") && (
                    <button type="button" className="btn btn-ghost" onClick={() => openEdit(email)}>
                      Modifier
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setPreview(email)}
                  >
                    Voir
                  </button>
                  {(st?.code === "draft" || st?.code === "ready" || st?.code === "failed") && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={sending || prospect.do_not_contact}
                      onClick={() => void sendEmail(email)}
                    >
                      {st?.code === "failed" ? "Réessayer" : "Envoyer"}
                    </button>
                  )}
                  {st?.code === "sent" && (
                    <button type="button" className="btn btn-ghost" onClick={() => void duplicate(email)}>
                      Dupliquer
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {emails.length === 0 && !composing && (
        <p className="text-muted">Aucun e-mail pour ce prospect.</p>
      )}
    </PortalSection>
  );
}
