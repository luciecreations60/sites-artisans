import { useEffect, useState } from "react";
import { Link } from "react-router";
import { fontPresets, themePresets } from "~/data/stylePresets";
import {
  clearProfile,
  emptyProfile,
  loadProfile,
  saveProfile,
  type Profile,
} from "~/lib/personalize";
import { TRADE_SLUGS, trades } from "~/data/trades";

type Props = {
  compact?: boolean;
  variant?: "default" | "light" | "immersive";
};

export function Personalizer({ compact, variant = "default" }: Props) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [tradeSlug, setTradeSlug] = useState("menuisier");
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded ?? emptyProfile());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const update = <K extends keyof Profile>(field: K, value: Profile[K]) => {
    setProfile((p) => ({ ...p, [field]: value }));
    setSaved(false);
  };

  const onSave = () => {
    saveProfile(profile);
    setSaved(true);
  };

  const onReset = () => {
    clearProfile();
    setProfile(emptyProfile());
    setSaved(false);
  };

  const previewName = profile.company.trim() || "Votre entreprise";
  const previewMeta =
    [profile.firstName, profile.city].filter(Boolean).join(" · ") || "Prénom · Ville";
  const trade = trades[tradeSlug as keyof typeof trades] ?? trades.menuisier;

  const stylePickers = (
    <>
      <div style={{ gridColumn: "1 / -1", marginTop: "0.35rem" }}>
        <p className="style-picker__label">Couleur du thème</p>
        <div className="style-swatches" role="listbox" aria-label="Couleur du thème">
          {themePresets.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="option"
              aria-selected={profile.themeId === theme.id}
              className={`style-swatch${profile.themeId === theme.id ? " is-active" : ""}`}
              title={theme.label}
              onClick={() => update("themeId", theme.id)}
              style={{ backgroundColor: theme.accent }}
            >
              <span className="visually-hidden">{theme.label}</span>
            </button>
          ))}
        </div>
        <p className="style-picker__hint">
          {themePresets.find((t) => t.id === profile.themeId)?.label ?? "Sauge"} — appliqué aux
          démos
        </p>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <p className="style-picker__label">Style de police</p>
        <div className="font-style-grid">
          {fontPresets.map((font) => (
            <button
              key={font.id}
              type="button"
              className={`font-style-card${profile.fontId === font.id ? " is-active" : ""}`}
              onClick={() => update("fontId", font.id)}
              style={{ fontFamily: font.display }}
            >
              <strong>{font.label}</strong>
              <span>{font.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  if (variant === "immersive") {
    return (
      <div className="aw-personalizer-grid">
        <div className="aw-form-card">
          <div className="personalizer personalizer--panel">
            <div className="personalizer__grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="sa-trade">Votre métier</label>
                <select
                  id="sa-trade"
                  value={tradeSlug}
                  onChange={(e) => setTradeSlug(e.target.value)}
                >
                  {TRADE_SLUGS.map((slug) => (
                    <option key={slug} value={slug}>
                      {trades[slug].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sa-company">Nom de votre entreprise</label>
                <input
                  id="sa-company"
                  value={profile.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Ex. Dupont Électricité"
                  autoComplete="organization"
                />
              </div>
              <div>
                <label htmlFor="sa-city">Votre ville / secteur</label>
                <input
                  id="sa-city"
                  value={profile.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Ex. Senlis"
                />
              </div>
              <div>
                <label htmlFor="sa-first">Votre prénom</label>
                <input
                  id="sa-first"
                  value={profile.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Ex. Nicolas"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label htmlFor="sa-spec">Spécialité (facultatif)</label>
                <input
                  id="sa-spec"
                  value={profile.specialty}
                  onChange={(e) => update("specialty", e.target.value)}
                  placeholder="Ex. dépannage urgent"
                />
              </div>
              {stylePickers}
            </div>
            <div className="hero-actions" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="btn btn-primary" onClick={onSave}>
                Créer mon aperçu personnalisé
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onReset}
                style={{ color: "#f0f4f2", borderColor: "rgba(255,255,255,.18)" }}
              >
                Réinitialiser
              </button>
            </div>
            {saved && (
              <p
                style={{
                  margin: "0.85rem 0 0",
                  color: "var(--eyebrow-light)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                Profil enregistré — ouvrez une démo ci-contre.
              </p>
            )}
          </div>
        </div>
        <aside className="aw-preview-card">
          <div>
            <p className="aw-preview-label">Aperçu</p>
            <p className="aw-preview-name">{previewName}</p>
            <p className="text-muted" style={{ margin: 0, color: "rgba(240,244,242,.62)" }}>
              {trade.label} · {previewMeta}
            </p>
            <p style={{ margin: "1.25rem 0 0", color: "rgba(240,244,242,.84)" }}>
              {profile.specialty.trim() || trade.specialty}
            </p>
          </div>
          <div className="aw-demo-buttons">
            <Link className="aw-demo-link" to={`/demos/${tradeSlug}/essentiel`} onClick={onSave}>
              Voir Essentiel <span>Niveau 1</span>
            </Link>
            <Link className="aw-demo-link" to={`/demos/${tradeSlug}/avance`} onClick={onSave}>
              Voir Avancé <span>Niveau 2</span>
            </Link>
            <Link className="aw-demo-link" to={`/demos/${tradeSlug}/pro`} onClick={onSave}>
              Voir Pro <span>Niveau 3</span>
            </Link>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="personalizer personalizer--light">
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem" }}>
        <strong>Personnaliser les démos</strong> — Ces infos s’affichent dans les démos à la
        place des exemples.
      </p>
      <div className="personalizer__grid">
        <div>
          <label htmlFor="sa-first">Prénom</label>
          <input
            id="sa-first"
            value={profile.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="sa-last">Nom</label>
          <input
            id="sa-last"
            value={profile.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            autoComplete="family-name"
          />
        </div>
        <div>
          <label htmlFor="sa-company">Entreprise</label>
          <input
            id="sa-company"
            value={profile.company}
            onChange={(e) => update("company", e.target.value)}
            autoComplete="organization"
          />
        </div>
        <div>
          <label htmlFor="sa-city">Ville</label>
          <input
            id="sa-city"
            value={profile.city}
            onChange={(e) => update("city", e.target.value)}
          />
        </div>
        {!compact && (
          <>
            <div>
              <label htmlFor="sa-phone">Téléphone</label>
              <input
                id="sa-phone"
                value={profile.phone}
                onChange={(e) => update("phone", e.target.value)}
                inputMode="tel"
              />
            </div>
            <div>
              <label htmlFor="sa-email">E-mail</label>
              <input
                id="sa-email"
                value={profile.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                autoComplete="email"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label htmlFor="sa-spec">Spécialité affichée</label>
              <input
                id="sa-spec"
                value={profile.specialty}
                onChange={(e) => update("specialty", e.target.value)}
              />
            </div>
          </>
        )}
        {stylePickers}
      </div>
      <div className="hero-actions" style={{ marginTop: "0.75rem" }}>
        <button type="button" className="btn btn-primary" onClick={onSave}>
          Enregistrer
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Réinitialiser
        </button>
      </div>
    </div>
  );
}
