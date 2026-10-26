import { useEffect, useState, type CSSProperties } from "react";
import type { OfferTier, TradeSlug } from "~/data/types";
import { trades } from "~/data/trades";
import { getFontPreset, getThemePreset } from "~/data/stylePresets";
import type { Profile } from "~/lib/personalize";
import { applyProfile } from "~/lib/personalize";
import { demoCopy } from "~/lib/demoCopy";
import { applyTierMedia } from "~/lib/demoMedia";
import { publicUrl } from "~/lib/publicUrl";
import { tierLabels } from "~/data/offers";

type Props = {
  tradeSlug: TradeSlug | null;
  planId: OfferTier | null;
  profile: Profile;
  selectedFeatureIds: string[];
  compact?: boolean;
};

const READY_PREVIEW_FEATURES = new Set([
  "gallery_basic",
  "gallery_filtered",
  "gallery_before_after",
  "contact_form",
  "quote_form",
  "estimator",
  "service_area",
  "testimonials",
  "services_list",
  "about_company",
  "mobile_cta",
]);

type PreviewPage = "accueil" | "services" | "realisations" | "devis" | "contact";

function navForPlan(
  planId: OfferTier | null,
  galleryHeading: string,
): { id: PreviewPage; label: string }[] {
  if (planId === "essentiel") return [{ id: "accueil", label: "Accueil" }];
  if (planId === "pro") {
    return [
      { id: "accueil", label: "Accueil" },
      { id: "services", label: "Services" },
      { id: "realisations", label: galleryHeading },
      { id: "devis", label: "Devis" },
      { id: "contact", label: "Contact" },
    ];
  }
  return [
    { id: "accueil", label: "Accueil" },
    { id: "services", label: "Services" },
    { id: "realisations", label: galleryHeading },
    { id: "contact", label: "Contact" },
  ];
}

export function SitePreview({
  tradeSlug,
  planId,
  profile,
  selectedFeatureIds,
  compact,
}: Props) {
  const slug = tradeSlug ?? "plombier";
  const base = trades[slug];
  const tiered = planId ? applyTierMedia(base, planId) : base;
  const trade = applyProfile(tiered, profile);
  const copy = demoCopy(trade);
  const theme = getThemePreset(profile.themeId) ?? {
    ink: trade.palette.ink,
    paper: trade.palette.paper,
    muted: trade.palette.muted,
    accent: trade.palette.accent,
    accentSoft: trade.palette.accentSoft,
    surface: trade.palette.surface,
  };
  const font = getFontPreset(profile.fontId);
  const company = profile.company.trim() || trade.defaultCompany;
  const city = profile.city.trim() || trade.defaultCity;
  const specialty = profile.specialty.trim() || trade.specialty;
  const heroSrc = trade.hero?.src
    ? trade.hero.src.startsWith("http") || trade.hero.src.startsWith("/")
      ? trade.hero.src
      : publicUrl(trade.hero.src)
    : publicUrl(`img/${slug}/essentiel/01-hero.jpg`);

  const show = (id: string) =>
    selectedFeatureIds.includes(id) && READY_PREVIEW_FEATURES.has(id);

  const navItems = navForPlan(planId, copy.galleryHeading);
  const [page, setPage] = useState<PreviewPage>("accueil");

  useEffect(() => {
    setPage("accueil");
  }, [planId]);

  const activePage = navItems.some((n) => n.id === page) ? page : "accueil";

  const isPro = planId === "pro";
  const isEssentiel = planId === "essentiel";

  return (
    <div
      className={`cfg-preview${compact ? " cfg-preview--compact" : ""}${
        isPro ? " cfg-preview--pro" : ""
      }${planId === "avance" ? " cfg-preview--avance" : ""}`}
      style={
        {
          "--cfg-ink": isPro ? "#f4efe6" : theme.ink,
          "--cfg-paper": isPro ? "#12151a" : theme.paper,
          "--cfg-muted": isPro ? "#c5ced8" : theme.muted,
          "--cfg-accent": theme.accent,
          "--cfg-soft": theme.accentSoft,
          "--cfg-surface": isPro ? "#1c222c" : theme.surface,
          "--cfg-display": font?.display ?? "Georgia, serif",
          "--cfg-body": font?.body ?? "system-ui, sans-serif",
        } as CSSProperties
      }
    >
      <div className="cfg-preview__chrome" aria-hidden>
        <span />
        <span />
        <span />
        <em>
          Aperçu {planId ? tierLabels[planId] : "votre site"} — {trade.label}
        </em>
      </div>
      <div className="cfg-preview__frame">
        <header className="cfg-preview__nav">
          <strong style={{ fontFamily: "var(--cfg-display)" }}>{company}</strong>
          <nav aria-label="Pages de l’aperçu">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={activePage === item.id ? "is-active" : undefined}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        {activePage === "accueil" && (
          <>
            <div className={`cfg-preview__hero${isPro ? " cfg-preview__hero--pro" : ""}`}>
              <img src={heroSrc} alt="" />
              <div className="cfg-preview__hero-copy">
                <p className="cfg-preview__eyebrow">{specialty}</p>
                <h3 style={{ fontFamily: "var(--cfg-display)" }}>{company}</h3>
                <p>
                  {trade.tagline} · {city}
                </p>
                {(show("contact_form") || show("mobile_cta") || true) && (
                  <span className="cfg-preview__cta">Nous contacter</span>
                )}
              </div>
            </div>
            <div className="cfg-preview__sections">
              {(show("services_list") || planId) && (
                <section>
                  <h4 style={{ fontFamily: "var(--cfg-display)" }}>Prestations</h4>
                  <ul>
                    {trade.services.slice(0, isEssentiel ? 3 : 4).map((s) => (
                      <li key={s.title}>{s.title}</li>
                    ))}
                  </ul>
                </section>
              )}
              {(show("gallery_basic") ||
                show("gallery_filtered") ||
                show("gallery_before_after") ||
                planId) && (
                <section>
                  <h4 style={{ fontFamily: "var(--cfg-display)" }}>{copy.galleryHeading}</h4>
                  <div className="cfg-preview__gallery">
                    {trade.projects.slice(0, isPro ? 3 : 2).map((p) => (
                      <figure key={p.id}>
                        <img
                          src={
                            p.image.src.startsWith("http") || p.image.src.startsWith("/")
                              ? p.image.src
                              : publicUrl(p.image.src)
                          }
                          alt=""
                        />
                        <figcaption>{p.title}</figcaption>
                      </figure>
                    ))}
                  </div>
                  {show("gallery_before_after") && isPro && (
                    <p className="cfg-preview__badge">Avant / après disponible</p>
                  )}
                </section>
              )}
              {show("testimonials") && trade.testimonials[0] && (
                <section>
                  <h4 style={{ fontFamily: "var(--cfg-display)" }}>Avis</h4>
                  <blockquote>“{trade.testimonials[0].text.slice(0, 90)}…”</blockquote>
                </section>
              )}
            </div>
          </>
        )}

        {activePage === "services" && (
          <div className="cfg-preview__sections">
            <section>
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>Services</h4>
              <ul>
                {trade.services.map((s) => (
                  <li key={s.title}>
                    {s.title}
                    {s.priceFrom ? ` — dès ${s.priceFrom}` : ""}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}

        {activePage === "realisations" && (
          <div className="cfg-preview__sections">
            <section>
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>{copy.galleryHeading}</h4>
              <div className="cfg-preview__gallery">
                {trade.projects.slice(0, isPro ? 4 : 3).map((p) => (
                  <figure key={p.id}>
                    <img
                      src={
                        p.image.src.startsWith("http") || p.image.src.startsWith("/")
                          ? p.image.src
                          : publicUrl(p.image.src)
                      }
                      alt=""
                    />
                    <figcaption>{p.title}</figcaption>
                  </figure>
                ))}
              </div>
              {isPro && show("gallery_before_after") && (
                <p className="cfg-preview__badge">Module avant / après</p>
              )}
            </section>
          </div>
        )}

        {activePage === "devis" && (
          <div className="cfg-preview__sections">
            <section className="cfg-preview__form-card">
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>
                {show("estimator") ? "Estimation indicative" : "Demande de devis"}
              </h4>
              <div className="cfg-preview__fake-fields">
                <span />
                <span />
                <span />
              </div>
            </section>
          </div>
        )}

        {activePage === "contact" && (
          <div className="cfg-preview__sections">
            <section className="cfg-preview__form-card">
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>Contact</h4>
              <p>
                {city} · {trade.defaultPhone}
              </p>
              <div className="cfg-preview__fake-fields">
                <span />
                <span />
              </div>
            </section>
            {show("service_area") && (
              <section>
                <h4 style={{ fontFamily: "var(--cfg-display)" }}>{copy.areaTitle}</h4>
                <p>{copy.areaText(city)}</p>
              </section>
            )}
          </div>
        )}
      </div>
      <p className="cfg-preview__note">
        Aperçu {planId ? tierLabels[planId].toLowerCase() : "indicatif"} — contenu d’exemple
        métier, pas une réalisation client réelle. Cliquez les pages pour parcourir.
      </p>
    </div>
  );
}
