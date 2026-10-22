import {
  fontsFor,
  themeFor,
  type SiteBuildConfig,
} from "./buildConfig.ts";

/** Échappement HTML — empêche l’injection depuis contenus client. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function esc(value: string): string {
  return escapeHtml(value);
}

function has(cfg: SiteBuildConfig, moduleId: string): boolean {
  return cfg.modules.includes(moduleId);
}

function shellClass(planId: SiteBuildConfig["planId"]): string {
  if (planId === "pro") return "r-shell";
  if (planId === "avance") return "sg-shell";
  return "e-shell";
}

/**
 * Génère un site HTML statique aligné sur les shells démo (e / sg / r).
 * Même métier/formule/thème ⇒ structure et modules cohérents avec les démos commercialisées.
 * Les composants React démo ne sont pas embarqués (build autonome) ; la différenciation visuelle est préservée.
 */
export function renderSiteHtml(cfg: SiteBuildConfig): { files: Record<string, string> } {
  const theme = themeFor(cfg.themeId);
  const fonts = fontsFor(cfg.fontId);
  const c = cfg.content;
  const title = esc(cfg.companyName);
  const city = esc(cfg.city);
  const specialty = esc(cfg.specialty || c.activityDescription || "");
  const shell = shellClass(cfg.planId);
  const isPro = cfg.planId === "pro";
  const isAvance = cfg.planId === "avance";
  const multi = isPro || isAvance;

  const testBanner = cfg.isTestFixture
    ? `<aside class="banner-test" role="status">Site de TEST — contenu fictif, ne pas publier comme site client.</aside>`
    : "";

  const photoPlaceholder =
    c.photoCount > 0
      ? Array.from({ length: Math.min(c.photoCount, isPro ? 6 : 3) }, (_, i) => {
          return `<figure class="gallery__item"><div class="ph" role="img" aria-label="Photo ${i + 1} — média client à intégrer"></div><figcaption>Photo ${i + 1}</figcaption></figure>`;
        }).join("\n")
      : `<p class="missing">Photos manquantes — non remplacées par des images de démonstration.</p>`;

  const contactForm = has(cfg, "contact_form")
    ? `<form class="contact" action="#" method="get" data-needs-backend="true" novalidate>
  <p class="note">Formulaire : configurez un service d’envoi réel avant mise en ligne. Aucune confirmation fictive.</p>
  <label>Nom <input name="name" required autocomplete="name" /></label>
  <label>E-mail <input name="email" type="email" required autocomplete="email" /></label>
  <label>Message <textarea name="message" required rows="4"></textarea></label>
  <button type="submit" class="btn">Envoyer</button>
</form>`
    : "";

  const booking = c.bookingUrl.trim()
    ? `<p><a class="btn btn--ghost" href="${esc(c.bookingUrl)}" rel="noopener noreferrer">Réserver en ligne</a></p>`
    : "";

  const estimator = has(cfg, "estimator")
    ? `<section class="wrap section" id="estimateur"><h2>Estimation indicative</h2><p class="note">Barème artisan à configurer — aucun montant inventé, distinct des tarifs Site AZ.</p><div class="estimator-stub" data-module="estimator" aria-live="polite">Estimateur prêt — saisie des options côté mise en ligne.</div></section>`
    : "";

  const beforeAfter = has(cfg, "gallery_before_after")
    ? `<section class="wrap section" id="avant-apres"><h2>Avant / après</h2><p class="missing">Paires d’images client requises — aucun faux chantier.</p><div class="ba-stub" data-module="before_after" tabindex="0" role="img" aria-label="Curseur avant/après — images manquantes"></div></section>`
    : "";

  const pages: Record<string, string> = {};

  const css = `/* Site AZ — généré ${cfg.templateVersion} — shell ${shell} */
:root {
  --ink: ${theme.ink};
  --paper: ${theme.paper};
  --accent: ${theme.accent};
  --muted: ${theme.muted};
  --display: ${fonts.display};
  --body: ${fonts.body};
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  font-family: var(--body);
  color: var(--ink);
  background: var(--paper);
  line-height: 1.55;
}
h1, h2, h3 { font-family: var(--display); line-height: 1.15; font-weight: 650; }
a { color: var(--accent); }
a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.wrap { width: min(1120px, 92%); margin: 0 auto; }
.banner-test { background: #7a2e0b; color: #fff; padding: 0.65rem 1rem; text-align: center; font-weight: 600; }
.missing { color: var(--muted); font-style: italic; }
.note { font-size: 0.9rem; color: var(--muted); }
.btn {
  display: inline-block;
  background: var(--accent);
  color: #fff !important;
  text-decoration: none;
  padding: 0.8rem 1.2rem;
  border-radius: 0.35rem;
  border: none;
  font: inherit;
  cursor: pointer;
}
.btn--ghost {
  background: transparent;
  color: var(--ink) !important;
  border: 1px solid color-mix(in srgb, var(--ink) 25%, transparent);
}
.site-nav {
  display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;
  padding: 1rem 0; font-size: 0.95rem;
}
.site-nav a { text-decoration: none; color: inherit; }
.site-nav a:hover { color: var(--accent); }
.section { padding: 2.75rem 0; border-top: 1px solid color-mix(in srgb, var(--ink) 10%, transparent); }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.ph { aspect-ratio: 4/3; background: color-mix(in srgb, var(--accent) 22%, var(--paper)); border-radius: 0.35rem; }
.contact label { display: block; margin-bottom: 0.75rem; }
.contact input, .contact textarea { width: 100%; padding: 0.55rem; font: inherit; border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); border-radius: 0.3rem; background: #fff; }
footer.site-footer { padding: 2.5rem 0 3rem; font-size: 0.9rem; color: var(--muted); }

/* Essentiel — one-page clair (e-shell) */
.e-shell .hero {
  padding: 3.5rem 0 2.5rem;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: center;
}
.e-shell .hero__visual {
  min-height: 220px;
  border-radius: 0.5rem;
  background: linear-gradient(145deg, color-mix(in srgb, var(--accent) 35%, var(--paper)), var(--paper));
}
.e-shell .hero h1 { font-size: clamp(2rem, 4.5vw, 3rem); margin: 0 0 0.5rem; }

/* Avancé — éditorial multipage (sg-shell) */
.sg-shell {
  background:
    radial-gradient(1200px 400px at 10% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent),
    var(--paper);
}
.sg-shell .hero {
  padding: 4.5rem 0 3rem;
  display: grid;
  gap: 1.25rem;
}
.sg-shell .hero h1 { font-size: clamp(2.2rem, 5vw, 3.4rem); max-width: 14ch; }
.sg-shell .hero__band {
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: color-mix(in srgb, var(--accent) 12%, #fff);
  border-left: 4px solid var(--accent);
}
.sg-shell .card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}
.sg-shell .card-grid article {
  padding: 1.25rem;
  background: #fff;
  border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
}

/* Pro — premium immersif (r-shell) */
.r-shell {
  --paper: color-mix(in srgb, ${theme.ink} 92%, #0a0a0a);
  --ink: #f3f1ec;
  --muted: color-mix(in srgb, #f3f1ec 62%, transparent);
  background: var(--paper);
  color: var(--ink);
}
.r-shell .hero {
  min-height: min(78vh, 640px);
  display: grid;
  align-content: end;
  padding: 5rem 0 3rem;
  background:
    linear-gradient(180deg, transparent 20%, var(--paper) 95%),
    radial-gradient(800px 500px at 70% 20%, color-mix(in srgb, var(--accent) 45%, transparent), transparent);
}
.r-shell .hero h1 { font-size: clamp(2.4rem, 6vw, 3.8rem); max-width: 12ch; }
.r-shell .site-nav a { color: var(--ink); }
.r-shell .contact input, .r-shell .contact textarea {
  background: color-mix(in srgb, #fff 8%, transparent);
  color: var(--ink);
  border-color: color-mix(in srgb, #fff 22%, transparent);
}
.r-shell .ph { background: color-mix(in srgb, var(--accent) 35%, #111); }
.ba-stub, .estimator-stub {
  min-height: 160px;
  border: 1px dashed color-mix(in srgb, var(--accent) 50%, transparent);
  border-radius: 0.4rem;
  display: grid;
  place-items: center;
  padding: 1rem;
}

@media (max-width: 768px) {
  .e-shell .hero { grid-template-columns: 1fr; }
  .hero { padding-top: 2.25rem; }
  .gallery { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 375px) {
  .gallery { grid-template-columns: 1fr; }
  .site-nav { gap: 0.65rem; }
}
`;

  const navLinks = multi
    ? `<a href="index.html">Accueil</a><a href="services.html">Services</a><a href="realisations.html">Réalisations</a><a href="contact.html">Contact</a>`
    : `<a href="#services">Prestations</a><a href="#realisations">Réalisations</a><a href="#contact">Contact</a>`;

  const heroInner = isPro
    ? `<p class="eyebrow muted">${esc(cfg.tradeSlug)} · ${city}</p>
       <h1>${title}</h1>
       <p class="lead">${specialty || "—"}</p>
       ${c.publicPhone ? `<p><a href="tel:${esc(c.publicPhone)}">${esc(c.publicPhone)}</a></p>` : `<p class="missing">Téléphone à confirmer</p>`}
       <p><a class="btn" href="contact.html">Nous contacter</a></p>`
    : isAvance
      ? `<p class="muted">${esc(cfg.tradeSlug)} · ${city}</p>
         <h1>${title}</h1>
         <p>${specialty || "—"}</p>
         <div class="hero__band"><strong>${specialty || "Votre spécialité"}</strong> — ${city}</div>
         <p><a class="btn" href="contact.html">Demander un devis</a></p>`
      : `<div>
           <p class="muted">${esc(cfg.tradeSlug)} · ${city}</p>
           <h1>${title}</h1>
           <p>${specialty || "—"}</p>
           ${c.publicPhone ? `<p><a href="tel:${esc(c.publicPhone)}">${esc(c.publicPhone)}</a></p>` : `<p class="missing">Téléphone à confirmer</p>`}
           <p><a class="btn" href="#contact">Nous contacter</a></p>
         </div>
         <div class="hero__visual" aria-hidden="true"></div>`;

  const homeBody = `${testBanner}
<header class="wrap">
  <nav class="site-nav" aria-label="Principale">${navLinks}</nav>
</header>
<main>
  <section class="hero wrap" data-section="hero">${heroInner}</section>
  ${has(cfg, "about_company") ? `<section class="wrap section" id="about" data-section="about"><h2>À propos</h2><p>${esc(c.aboutText || c.activityDescription || "Texte à valider")}</p></section>` : ""}
  ${has(cfg, "services_list") ? `<section class="wrap section" id="services" data-section="services"><h2>Prestations</h2>${isAvance ? `<div class="card-grid"><article><h3>Prestations</h3><p>${esc(c.servicesDetail || "À détailler")}</p></article><article><h3>Zone</h3><p>${esc(c.serviceArea || "À confirmer")}</p></article><article><h3>Horaires</h3><p>${esc(c.hours || "À confirmer")}</p></article></div>` : `<p>${esc(c.servicesDetail || "Prestations à détailler")}</p>`}</section>` : ""}
  ${has(cfg, "gallery_basic") ? `<section class="wrap section" id="realisations" data-section="gallery"><h2>Réalisations</h2><div class="gallery">${photoPlaceholder}</div></section>` : ""}
  ${has(cfg, "service_area") && c.serviceArea && !isAvance ? `<section class="wrap section" data-section="area"><h2>Zone d’intervention</h2><p>${esc(c.serviceArea)}</p></section>` : ""}
  ${estimator}
  ${beforeAfter}
  ${!multi ? `<section class="wrap section" id="contact" data-section="contact"><h2>Contact</h2>${c.publicEmail ? `<p><a href="mailto:${esc(c.publicEmail)}">${esc(c.publicEmail)}</a></p>` : ""} ${booking} ${contactForm}</section>` : ""}
</main>
<footer class="wrap site-footer" data-section="footer">
  <p>${title} — ${city}</p>
  <p>${esc(c.legalMentions || "Mentions légales à compléter")}</p>
  <p class="note">Généré ${esc(cfg.generatedAt)} · template ${esc(cfg.templateVersion)} · shell ${shell} · config v${cfg.version}</p>
</footer>`;

  pages["styles.css"] = css;
  pages["index.html"] = wrapPage(title, homeBody, shell);

  if (multi) {
    pages["services.html"] = wrapPage(
      `${title} — Services`,
      `${testBanner}<header class="wrap"><nav class="site-nav">${navLinks}</nav></header>
<main class="wrap section" data-section="services"><h1>Services</h1><p>${esc(c.servicesDetail || "À compléter")}</p>
${c.hours ? `<h2>Horaires</h2><p>${esc(c.hours)}</p>` : ""}
${estimator}</main><footer class="wrap site-footer"><p><a href="index.html">Accueil</a></p></footer>`,
      shell,
    );
    pages["realisations.html"] = wrapPage(
      `${title} — Réalisations`,
      `${testBanner}<header class="wrap"><nav class="site-nav">${navLinks}</nav></header>
<main class="wrap section" data-section="gallery"><h1>Réalisations</h1>
<div class="gallery">${photoPlaceholder}</div>${beforeAfter}</main>
<footer class="wrap site-footer"><p><a href="index.html">Accueil</a></p></footer>`,
      shell,
    );
    pages["contact.html"] = wrapPage(
      `${title} — Contact`,
      `${testBanner}<header class="wrap"><nav class="site-nav">${navLinks}</nav></header>
<main class="wrap section" data-section="contact"><h1>Contact</h1>
<p>${esc(c.publicAddress || "")}</p>
<p>${c.publicPhone ? esc(c.publicPhone) : ""} ${c.publicEmail ? esc(c.publicEmail) : ""}</p>
${booking}${contactForm}
${has(cfg, "quote_form") ? `<section data-section="quote"><h2>Demande de devis</h2><p class="note">Formulaire guidé — backend d’envoi à configurer avant production.</p></section>` : ""}
</main><footer class="wrap site-footer"><p><a href="index.html">Accueil</a></p></footer>`,
      shell,
    );
  }

  pages["site.json"] = JSON.stringify(
    {
      version: cfg.version,
      templateVersion: cfg.templateVersion,
      projectId: cfg.projectId,
      jobId: cfg.jobId,
      tradeSlug: cfg.tradeSlug,
      planId: cfg.planId,
      shell,
      modules: cfg.modules,
      isTestFixture: cfg.isTestFixture,
      generatedAt: cfg.generatedAt,
    },
    null,
    2,
  );

  pages["README.txt"] = [
    `Site généré pour ${cfg.companyName}`,
    `Formule : ${cfg.planId} (shell ${shell})`,
    `Template : ${cfg.templateVersion}`,
    cfg.isTestFixture ? "ATTENTION : fixture TEST — ne pas publier comme site client." : "",
    "",
    "Hébergement : le client possède et paie son hébergement.",
    "Formulaires : configurez un service d’envoi réel avant mise en ligne.",
    "Aucun secret Site AZ / Supabase n’est inclus.",
  ]
    .filter(Boolean)
    .join("\n");

  return { files: pages };
}

function wrapPage(title: string, body: string, shell: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body class="${shell}">
${body}
</body>
</html>
`;
}

/** Sections attendues pour tests de parité démo / générateur. */
export function expectedSectionsForPlan(planId: SiteBuildConfig["planId"]): string[] {
  const base = ["hero", "about", "services", "gallery", "footer"];
  if (planId === "essentiel") return [...base, "contact"];
  return base;
}
