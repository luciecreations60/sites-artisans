import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router";
import { fontPresets, themePresets } from "~/data/stylePresets";
import { TRADE_SLUGS, trades } from "~/data/trades";
import type { OfferTier } from "~/data/types";
import type { Prospect } from "~/lib/crm.types";
import { formatDateFr } from "~/lib/portal";
import {
  generatePublicSlug,
  isProspectDemoPubliclyAccessible,
  normalizeOfferTiers,
  publicDemoPath,
  snapshotFromProspect,
} from "~/lib/prospectDemo";
import type { ProspectDemo } from "~/lib/prospectDemo.types";
import { getSupabase } from "~/lib/supabase";
import { useCrmRefs } from "~/lib/useCrmRefs";
import { ErrorState, PortalSection } from "~/components/portal/PortalUi";

const ALL_TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

type Props = {
  prospect: Prospect;
  onInteractionLogged?: () => void;
};

async function logDemoInteraction(
  prospectId: string,
  title: string,
  detail: string | null,
  demoTypeId: string | undefined,
) {
  if (!demoTypeId) return;
  const sb = getSupabase();
  if (!sb) return;
  await sb.from("prospect_interactions").insert({
    prospect_id: prospectId,
    interaction_type_id: demoTypeId,
    title,
    detail,
  });
}

export function ProspectDemosPanel({ prospect, onInteractionLogged }: Props) {
  const { refs, byId, byCode } = useCrmRefs();
  const [demos, setDemos] = useState<ProspectDemo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const demoTypeId = byCode(refs.interactionTypes, "demo")?.id;

  async function reload() {
    const sb = getSupabase();
    if (!sb) return;
    const { data, error: e } = await sb
      .from("prospect_demos")
      .select("*")
      .eq("prospect_id", prospect.id)
      .order("created_at", { ascending: false });
    if (e) setError(e.message);
    setDemos((data as ProspectDemo[]) ?? []);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id]);

  async function createDemo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setError(null);
    const fd = new FormData(e.currentTarget);
    const draftStatus = byCode(refs.demoStatuses, "draft");
    if (!draftStatus) {
      setError("Statut « draft » introuvable. Exécutez la migration Phase 2.");
      return;
    }
    const snap = snapshotFromProspect(prospect);
    const tradeSlug = String(fd.get("trade_slug") || snap.trade_slug);
    const tiers = ALL_TIERS.filter((t) => fd.get(`tier_${t}`) === "on");
    const company = String(fd.get("company_name") || snap.company_name).trim();
    if (!company) {
      setError("Le nom d’entreprise est requis.");
      return;
    }

    let publicSlug = generatePublicSlug(company);
    let inserted: ProspectDemo | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error: e2 } = await sb
        .from("prospect_demos")
        .insert({
          prospect_id: prospect.id,
          status_id: draftStatus.id,
          public_slug: publicSlug,
          trade_slug: tradeSlug,
          enabled_offer_tiers: tiers.length ? tiers : ALL_TIERS,
          company_name: company,
          commercial_name: strOrNull(fd.get("commercial_name")) ?? snap.commercial_name,
          contact_first_name:
            strOrNull(fd.get("contact_first_name")) ?? snap.contact_first_name,
          contact_last_name:
            strOrNull(fd.get("contact_last_name")) ?? snap.contact_last_name,
          specialty: strOrNull(fd.get("specialty")) ?? snap.specialty,
          city: strOrNull(fd.get("city")) ?? snap.city,
          phone: strOrNull(fd.get("phone")) ?? snap.phone,
          email: strOrNull(fd.get("email")) ?? snap.email,
          address: snap.address,
          service_area: snap.service_area,
          custom_tagline: strOrNull(fd.get("custom_tagline")),
          custom_intro: strOrNull(fd.get("custom_intro")),
          theme_id: String(fd.get("theme_id") || "sage"),
          font_id: String(fd.get("font_id") || "classic"),
        })
        .select("*")
        .maybeSingle();
      if (!e2 && data) {
        inserted = data as ProspectDemo;
        break;
      }
      if (e2?.code === "23505") {
        publicSlug = generatePublicSlug(company);
        continue;
      }
      setError(e2?.message ?? "Création impossible.");
      return;
    }
    if (!inserted) {
      setError("Collision de slug — réessayez.");
      return;
    }
    await logDemoInteraction(
      prospect.id,
      "Démo créée",
      `Slug : ${inserted.public_slug}`,
      demoTypeId,
    );
    setOk("Démo créée.");
    setCreating(false);
    await reload();
    onInteractionLogged?.();
  }

  async function saveDemo(demoId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const tiers = ALL_TIERS.filter((t) => fd.get(`tier_${t}`) === "on");
    const { error: e2 } = await sb
      .from("prospect_demos")
      .update({
        trade_slug: String(fd.get("trade_slug")),
        enabled_offer_tiers: tiers.length ? tiers : ALL_TIERS,
        company_name: String(fd.get("company_name") || "").trim(),
        commercial_name: strOrNull(fd.get("commercial_name")),
        contact_first_name: strOrNull(fd.get("contact_first_name")),
        contact_last_name: strOrNull(fd.get("contact_last_name")),
        specialty: strOrNull(fd.get("specialty")),
        city: strOrNull(fd.get("city")),
        phone: strOrNull(fd.get("phone")),
        email: strOrNull(fd.get("email")),
        custom_tagline: strOrNull(fd.get("custom_tagline")),
        custom_intro: strOrNull(fd.get("custom_intro")),
        theme_id: String(fd.get("theme_id") || "sage"),
        font_id: String(fd.get("font_id") || "classic"),
        expires_at: parseLocalDateTime(strOrNull(fd.get("expires_at"))),
        is_primary: fd.get("is_primary") === "on",
      })
      .eq("id", demoId);
    if (e2) setError(e2.message);
    else {
      setOk("Démo enregistrée.");
      setEditingId(null);
      await reload();
    }
  }

  async function setStatus(
    demo: ProspectDemo,
    code: "ready" | "published" | "shared" | "disabled",
  ) {
    const sb = getSupabase();
    if (!sb) return;
    const status = byCode(refs.demoStatuses, code);
    if (!status) {
      setError(`Statut « ${code} » introuvable.`);
      return;
    }
    const patch: Record<string, unknown> = { status_id: status.id };
    let title = "";
    if (code === "ready") {
      title = "Démo prête";
    } else if (code === "published") {
      patch.published_at = demo.published_at ?? new Date().toISOString();
      patch.disabled_at = null;
      title = "Démo publiée";
    } else if (code === "shared") {
      patch.published_at = demo.published_at ?? new Date().toISOString();
      patch.shared_at = new Date().toISOString();
      patch.disabled_at = null;
      title = "Démo partagée";
    } else if (code === "disabled") {
      patch.disabled_at = new Date().toISOString();
      title = "Démo désactivée";
    }
    const { error: e } = await sb.from("prospect_demos").update(patch).eq("id", demo.id);
    if (e) {
      setError(e.message);
      return;
    }
    await logDemoInteraction(prospect.id, title, demo.public_slug, demoTypeId);
    setOk(title + ".");
    await reload();
    onInteractionLogged?.();
  }

  async function copyLink(slug: string) {
    const url = `${window.location.origin}${publicDemoPath(slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setOk("Lien copié.");
    } catch {
      setOk(url);
    }
  }

  const snapDefaults = useMemo(() => snapshotFromProspect(prospect), [prospect]);

  return (
    <PortalSection title="Démos personnalisées">
      {error && <ErrorState message={error} />}
      {ok && <p className="portal-success">{ok}</p>}

      <div className="crm-header-actions" style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCreating((v) => !v);
            setOk(null);
          }}
        >
          {creating ? "Annuler" : "Créer une démo"}
        </button>
      </div>

      {creating && (
        <form className="stack-form admin-upload-form" onSubmit={(e) => void createDemo(e)}>
          <DemoFormFields defaults={snapDefaults} />
          <button type="submit" className="btn btn-primary">
            Enregistrer le brouillon
          </button>
        </form>
      )}

      {demos.length === 0 && !creating && (
        <p className="text-muted">Aucune démo pour ce prospect.</p>
      )}

      <ul className="crm-demo-list">
        {demos.map((demo) => {
          const status = byId(refs.demoStatuses, demo.status_id);
          const accessible = isProspectDemoPubliclyAccessible(demo, status);
          const tiers = normalizeOfferTiers(demo.enabled_offer_tiers);
          return (
            <li key={demo.id} className="crm-demo-card">
              <div className="crm-demo-card__head">
                <div>
                  <strong>
                    {demo.company_name}
                    {demo.is_primary ? " · Principale" : ""}
                  </strong>
                  <p className="text-muted" style={{ margin: "0.2rem 0 0" }}>
                    {trades[demo.trade_slug as keyof typeof trades]?.label ?? demo.trade_slug}
                    {" · "}
                    {status?.label ?? "—"}
                    {" · "}
                    {tiers.join(", ")}
                    {accessible ? " · Lien public actif" : " · Non public"}
                  </p>
                  <p className="text-muted" style={{ margin: "0.2rem 0 0", fontSize: "0.85rem" }}>
                    <code>{demo.public_slug}</code>
                    {" · "}
                    {demo.view_count} vue{demo.view_count === 1 ? "" : "s"}
                    {demo.last_viewed_at
                      ? ` · dernière ${formatDateFr(demo.last_viewed_at)}`
                      : ""}
                  </p>
                </div>
                <div className="crm-header-actions">
                  <Link
                    to={`/demo/${demo.public_slug}?preview=1`}
                    className="btn btn-ghost"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Aperçu
                  </Link>
                  {(status?.code === "published" || status?.code === "shared") && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void copyLink(demo.public_slug)}
                    >
                      Copier le lien
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      setEditingId((id) => (id === demo.id ? null : demo.id))
                    }
                  >
                    {editingId === demo.id ? "Fermer" : "Éditer"}
                  </button>
                </div>
              </div>

              <div className="crm-header-actions" style={{ marginTop: "0.75rem" }}>
                {status?.code === "draft" && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void setStatus(demo, "ready")}
                  >
                    Marquer prête
                  </button>
                )}
                {(status?.code === "draft" || status?.code === "ready") && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void setStatus(demo, "published")}
                  >
                    Publier
                  </button>
                )}
                {(status?.code === "published" || status?.code === "ready") && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void setStatus(demo, "shared")}
                  >
                    Marquer partagée
                  </button>
                )}
                {(status?.code === "published" || status?.code === "shared") && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => void setStatus(demo, "disabled")}
                  >
                    Désactiver
                  </button>
                )}
                {status?.code === "disabled" && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => void setStatus(demo, "published")}
                  >
                    Republier
                  </button>
                )}
              </div>

              {editingId === demo.id && (
                <form
                  className="stack-form admin-upload-form"
                  style={{ marginTop: "1rem" }}
                  onSubmit={(e) => void saveDemo(demo.id, e)}
                >
                  <DemoFormFields demo={demo} defaults={snapDefaults} />
                  <label>
                    Expiration (optionnel)
                    <input
                      type="datetime-local"
                      name="expires_at"
                      defaultValue={toLocalInput(demo.expires_at)}
                    />
                  </label>
                  <label className="crm-check">
                    <input
                      type="checkbox"
                      name="is_primary"
                      defaultChecked={demo.is_primary}
                    />
                    Démo principale
                  </label>
                  <button type="submit" className="btn btn-primary">
                    Enregistrer
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </PortalSection>
  );
}

function DemoFormFields({
  demo,
  defaults,
}: {
  demo?: ProspectDemo;
  defaults: ReturnType<typeof snapshotFromProspect>;
}) {
  const tiers = normalizeOfferTiers(demo?.enabled_offer_tiers);
  return (
    <>
      <label>
        Métier
        <select name="trade_slug" defaultValue={demo?.trade_slug ?? defaults.trade_slug} required>
          {TRADE_SLUGS.map((s) => (
            <option key={s} value={s}>
              {trades[s].label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="crm-tiers">
        <legend>Offres activées</legend>
        {ALL_TIERS.map((t) => (
          <label key={t} className="crm-check">
            <input
              type="checkbox"
              name={`tier_${t}`}
              defaultChecked={tiers.includes(t)}
            />
            {t}
          </label>
        ))}
      </fieldset>
      <label>
        Entreprise
        <input
          name="company_name"
          required
          defaultValue={demo?.company_name ?? defaults.company_name}
        />
      </label>
      <label>
        Nom commercial
        <input
          name="commercial_name"
          defaultValue={demo?.commercial_name ?? defaults.commercial_name ?? ""}
        />
      </label>
      <div className="crm-summary-grid">
        <label>
          Prénom
          <input
            name="contact_first_name"
            defaultValue={
              demo?.contact_first_name ?? defaults.contact_first_name ?? ""
            }
          />
        </label>
        <label>
          Nom
          <input
            name="contact_last_name"
            defaultValue={
              demo?.contact_last_name ?? defaults.contact_last_name ?? ""
            }
          />
        </label>
      </div>
      <label>
        Spécialité
        <input name="specialty" defaultValue={demo?.specialty ?? defaults.specialty ?? ""} />
      </label>
      <label>
        Ville
        <input name="city" defaultValue={demo?.city ?? defaults.city ?? ""} />
      </label>
      <div className="crm-summary-grid">
        <label>
          Téléphone
          <input name="phone" defaultValue={demo?.phone ?? defaults.phone ?? ""} />
        </label>
        <label>
          E-mail
          <input name="email" defaultValue={demo?.email ?? defaults.email ?? ""} />
        </label>
      </div>
      <label>
        Accroche (tagline)
        <input name="custom_tagline" defaultValue={demo?.custom_tagline ?? ""} />
      </label>
      <label>
        Intro / à propos
        <textarea name="custom_intro" rows={3} defaultValue={demo?.custom_intro ?? ""} />
      </label>
      <div className="crm-summary-grid">
        <label>
          Thème
          <select name="theme_id" defaultValue={demo?.theme_id ?? "sage"}>
            {themePresets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Police
          <select name="font_id" defaultValue={demo?.font_id ?? "classic"}>
            {fontPresets.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s || null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseLocalDateTime(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
