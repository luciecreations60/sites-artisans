import type { CSSProperties } from "react";
import type { OfferTier, TradeSlug } from "~/data/types";
import { trades } from "~/data/trades";
import { getFontPreset, getThemePreset } from "~/data/stylePresets";
import type { Profile } from "~/lib/personalize";
import { applyProfile } from "~/lib/personalize";
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

export function SitePreview({
  tradeSlug,
  planId,
  profile,
  selectedFeatureIds,
  compact,
}: Props) {
  const slug = tradeSlug ?? "plombier";
  const base = trades[slug];
  const trade = applyProfile(base, profile);
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

  const navItems =
    planId === "essentiel"
      ? ["Accueil"]
      : planId === "pro"
        ? ["Accueil", "Services", "Réalisations", "Devis", "Contact"]
        : ["Accueil", "Services", "Réalisations", "Contact"];

  return (
    <div
      className={`cfg-preview${compact ? " cfg-preview--compact" : ""}`}
      style={
        {
          "--cfg-ink": theme.ink,
          "--cfg-paper": theme.paper,
          "--cfg-muted": theme.muted,
          "--cfg-accent": theme.accent,
          "--cfg-soft": theme.accentSoft,
          "--cfg-surface": theme.surface,
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
          <nav>
            {navItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </nav>
        </header>
        <div className="cfg-preview__hero">
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
                {trade.services.slice(0, planId === "essentiel" ? 3 : 4).map((s) => (
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
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>Réalisations</h4>
              <div className="cfg-preview__gallery">
                {trade.projects.slice(0, planId === "pro" ? 3 : 2).map((p) => (
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
              {show("gallery_before_after") && planId === "pro" && (
                <p className="cfg-preview__badge">Avant / après disponible</p>
              )}
            </section>
          )}
          {show("service_area") && (
            <section>
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>Zone d’intervention</h4>
              <p>Autour de {city}</p>
            </section>
          )}
          {(show("quote_form") || show("estimator")) && (
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
          )}
          {show("testimonials") && trade.testimonials[0] && (
            <section>
              <h4 style={{ fontFamily: "var(--cfg-display)" }}>Avis</h4>
              <blockquote>“{trade.testimonials[0].text.slice(0, 90)}…”</blockquote>
            </section>
          )}
        </div>
      </div>
      <p className="cfg-preview__note">
        Aperçu indicatif — contenu d’exemple métier, pas une réalisation client réelle.
      </p>
    </div>
  );
}
