import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { TRADE_SLUGS, trades } from "~/data/trades";
import type { Prospect } from "~/lib/crm.types";
import {
  invokeConvertProspectToClient,
  invokeResendClientInvite,
} from "~/lib/prospectConvertApi";
import type { ProspectDemo } from "~/lib/prospectDemo.types";
import { formatDateFr } from "~/lib/portal";
import { getSupabase } from "~/lib/supabase";
import type { OfferTier, Project } from "~/lib/supabase.types";
import { ErrorState, PortalSection } from "~/components/portal/PortalUi";

type Props = {
  prospect: Prospect;
  onConverted?: () => void;
};

export function ProspectConvertPanel({ prospect, onConverted }: Props) {
  const converted = Boolean(prospect.converted_at && prospect.converted_profile_id);
  const [open, setOpen] = useState(false);
  const [demos, setDemos] = useState<ProspectDemo[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const [email, setEmail] = useState(prospect.email ?? "");
  const [fullName, setFullName] = useState(
    [prospect.contact_first_name, prospect.contact_last_name].filter(Boolean).join(" "),
  );
  const [companyName, setCompanyName] = useState(prospect.company_name);
  const [phone, setPhone] = useState(prospect.phone ?? "");
  const [projectTitle, setProjectTitle] = useState(
    `Site web — ${prospect.company_name}`,
  );
  const [offerTier, setOfferTier] = useState<OfferTier | "">("");
  const [tradeSlug, setTradeSlug] = useState(prospect.trade_slug ?? "");
  const [notes, setNotes] = useState("");
  const [sourceDemoId, setSourceDemoId] = useState("");
  const [sendInvitation, setSendInvitation] = useState(true);

  useEffect(() => {
    setEmail(prospect.email ?? "");
    setFullName(
      [prospect.contact_first_name, prospect.contact_last_name].filter(Boolean).join(" "),
    );
    setCompanyName(prospect.company_name);
    setPhone(prospect.phone ?? "");
    setTradeSlug(prospect.trade_slug ?? "");
    setProjectTitle((t) => (t ? t : `Site web — ${prospect.company_name}`));
  }, [prospect]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    void sb
      .from("prospect_demos")
      .select("*")
      .eq("prospect_id", prospect.id)
      .then(({ data }) => setDemos((data as ProspectDemo[]) ?? []));
  }, [prospect.id]);

  useEffect(() => {
    if (!prospect.converted_at) {
      setProject(null);
      return;
    }
    const sb = getSupabase();
    if (!sb) return;
    void sb
      .from("projects")
      .select("*")
      .eq("source_prospect_id", prospect.id)
      .maybeSingle()
      .then(({ data }) => setProject((data as Project | null) ?? null));
  }, [prospect.id, prospect.converted_at]);

  async function onConvert(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    setInviteLink(null);
    const res = await invokeConvertProspectToClient({
      prospect_id: prospect.id,
      email: email.trim(),
      full_name: fullName.trim() || undefined,
      company_name: companyName.trim() || undefined,
      phone: phone.trim() || undefined,
      project_title: projectTitle.trim(),
      offer_tier: offerTier || null,
      trade_slug: tradeSlug || null,
      notes: notes.trim() || null,
      source_demo_id: sourceDemoId || null,
      send_invitation: sendInvitation,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Conversion impossible.");
      return;
    }
    if (res.invite_link) setInviteLink(res.invite_link);
    if (res.already_converted) {
      setOk("Ce prospect était déjà converti.");
    } else if (res.invitation_sent) {
      setOk("Conversion réussie — invitation envoyée par e-mail.");
    } else if (res.is_new_client && res.invite_link) {
      setOk(
        res.invitation_error
          ? `Conversion réussie. Envoi auto impossible (${res.invitation_error}) — copiez le lien ci-dessous.`
          : "Conversion réussie — copiez le lien d’invitation ci-dessous (non stocké).",
      );
    } else {
      setOk(
        res.is_new_client
          ? "Conversion réussie."
          : "Conversion réussie — client existant rattaché, aucun e-mail d’invitation.",
      );
    }
    setOpen(false);
    onConverted?.();
  }

  async function onResend() {
    if (!prospect.converted_profile_id) return;
    setBusy(true);
    setError(null);
    setOk(null);
    setInviteLink(null);
    const res = await invokeResendClientInvite(prospect.converted_profile_id, true);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Renvoi impossible.");
      return;
    }
    if (res.invite_link) setInviteLink(res.invite_link);
    if (res.invitation_sent) {
      setOk("Nouvelle invitation envoyée.");
    } else {
      setOk(
        res.invitation_error
          ? `Lien régénéré. Envoi auto impossible (${res.invitation_error}).`
          : "Nouveau lien d’invitation — copiez-le ci-dessous (non stocké).",
      );
    }
  }

  if (converted) {
    return (
      <div id="conversion" className="crm-convert-banner">
        <PortalSection title="Converti en client">
          <p>
            Converti le {formatDateFr(prospect.converted_at!)}
            {prospect.converted_profile_id ? (
              <>
                {" · "}
                <Link to={`/admin/clients`}>Voir les clients</Link>
              </>
            ) : null}
            {project ? (
              <>
                {" · "}
                <Link to={`/admin/projets/${project.id}`}>Projet : {project.title}</Link>
              </>
            ) : null}
          </p>
          <div className="crm-convert-actions">
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy}
              onClick={() => void onResend()}
            >
              {busy ? "…" : "Renvoyer / régénérer l’invitation"}
            </button>
          </div>
          {error && <ErrorState message={error} />}
          {ok && <p className="portal-success">{ok}</p>}
          {inviteLink && (
            <div className="crm-invite-link">
              <label>
                Lien d’invitation (affichage unique — non stocké)
                <input type="text" readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
              </label>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => void navigator.clipboard.writeText(inviteLink)}
              >
                Copier
              </button>
            </div>
          )}
        </PortalSection>
      </div>
    );
  }

  return (
    <div id="conversion">
      <PortalSection
        title="Conversion client"
        action={
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || Boolean(prospect.archived_at)}
            onClick={() => {
              setOpen((v) => !v);
              setError(null);
              setOk(null);
            }}
          >
            {open ? "Fermer" : "Transformer en client"}
          </button>
        }
      >
        <p className="text-muted">
          Crée ou rattache un compte client, un projet, clôture la prospection e-mail, puis invite
          à l’espace client si besoin.
        </p>
        {prospect.archived_at && (
          <p className="form-error">Restaurez le prospect avant de le convertir.</p>
        )}
        {error && <ErrorState message={error} />}
        {ok && <p className="portal-success">{ok}</p>}
        {inviteLink && (
          <div className="crm-invite-link">
            <label>
              Lien d’invitation (affichage unique — non stocké)
              <input type="text" readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
            </label>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void navigator.clipboard.writeText(inviteLink)}
            >
              Copier
            </button>
          </div>
        )}
        {open && (
          <form className="stack-form crm-convert-form" onSubmit={(e) => void onConvert(e)}>
            <label>
              E-mail de connexion
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              Nom du contact
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label>
              Entreprise
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
            <label>
              Téléphone
              <input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label>
              Titre du projet
              <input
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
              />
            </label>
            <div className="admin-form-row">
              <label>
                Formule
                <select
                  value={offerTier}
                  onChange={(e) => setOfferTier(e.target.value as OfferTier | "")}
                >
                  <option value="">—</option>
                  <option value="essentiel">Essentiel</option>
                  <option value="avance">Avancé</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label>
                Métier
                <select value={tradeSlug} onChange={(e) => setTradeSlug(e.target.value)}>
                  <option value="">—</option>
                  {TRADE_SLUGS.map((slug) => (
                    <option key={slug} value={slug}>
                      {trades[slug]?.label ?? slug}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {demos.length > 0 && (
              <label>
                Démo source (optionnel)
                <select
                  value={sourceDemoId}
                  onChange={(e) => setSourceDemoId(e.target.value)}
                >
                  <option value="">—</option>
                  {demos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.company_name} ({d.public_slug})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Notes projet
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <label className="portal-check">
              <input
                type="checkbox"
                checked={sendInvitation}
                onChange={(e) => setSendInvitation(e.target.checked)}
              />
              Envoyer l’invitation espace client (nouveau compte uniquement)
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Conversion…" : "Confirmer la conversion"}
            </button>
          </form>
        )}
      </PortalSection>
    </div>
  );
}
