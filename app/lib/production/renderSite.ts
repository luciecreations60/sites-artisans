import {
  fontsFor,
  themeFor,
  type SiteBuildConfig,
} from "./buildConfig.ts";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function has(cfg: SiteBuildConfig, moduleId: string): boolean {
  return cfg.modules.includes(moduleId);
}

/**
 * Génère un site HTML statique autonome à partir d’une configuration validée.
 * Déterministe pour une même config + templateVersion.
 */
export function renderSiteHtml(cfg: SiteBuildConfig): { files: Record<string, string> } {
  const theme = themeFor(cfg.themeId);
  const fonts = fontsFor(cfg.fontId);
  const c = cfg.content;
  const title = esc(cfg.companyName);
  const city = esc(cfg.city);
  const specialty = esc(cfg.specialty || c.activityDescription || "");

  const testBanner = cfg.isTestFixture
    ? `<aside class="banner-test" role="status">Site de TEST — contenu fictif, ne pas publier comme site client.</aside>`
    : "";

  const photoPlaceholder =
    c.photoCount > 0
      ? Array.from({ length: Math.min(c.photoCount, 6) }, (_, i) => {
          return `<figure class="gallery__item"><div class="ph" role="img" aria-label="Photo ${i + 1} — à remplacer par le média client"></div><figcaption>Photo ${i + 1}</figcaption></figure>`;
        }).join("\n")
      : `<p class="missing">Photos manquantes — non remplacées par des images de démonstration.</p>`;

  const contactForm = has(cfg, "contact_form")
    ? `<form class="contact" action="#" method="get" data-needs-backend="true">
  <p class="note">Formulaire : configurez un service d’envoi réel avant mise en ligne. Aucune confirmation fictive.</p>
  <label>Nom <input name="name" required autocomplete="name" /></label>
  <label>E-mail <input name="email" type="email" required autocomplete="email" /></label>
  <label>Message <textarea name="message" required rows="4"></textarea></label>
  <button type="submit">Envoyer</button>
</form>`
    : "";

  const booking =
    c.bookingUrl.trim()
      ? `<p><a class="btn" href="${esc(c.bookingUrl)}" rel="noopener noreferrer">Réserver en ligne</a></p>`
      : has(cfg, "quote_form")
        ? `<p class="missing">Lien de réservation non fourni.</p>`
        : "";

  const estimator = has(cfg, "estimator")
    ? `<section id="estimateur"><h2>Estimation indicative</h2><p class="note">Module prêt — barème artisan à configurer. Pas de montant inventé.</p></section>`
    : "";

  const beforeAfter = has(cfg, "gallery_before_after")
    ? `<section id="avant-apres"><h2>Avant / après</h2><p class="missing">Paires d’images client requises — aucun faux avant/après.</p></section>`
    : "";

  const pages: Record<string, string> = {};

  const css = `/* Sites Artisans — site client généré (${cfg.templateVersion}) */
:root {
  --ink: ${theme.ink};
  --paper: ${theme.paper};
  --accent: ${theme.accent};
  --muted: ${theme.muted};
  --display: ${fonts.display};
  --body: ${fonts.body};
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--body);
  color: var(--ink);
  background: var(--paper);
  line-height: 1.55;
}
h1, h2, h3 { font-family: var(--display); line-height: 1.2; }
a { color: var(--accent); }
.wrap { width: min(1100px, 92%); margin: 0 auto; }
.hero { padding: 4rem 0 3rem; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.25rem); margin: 0 0 0.5rem; }
.muted { color: var(--muted); }
.btn {
  display: inline-block;
  background: var(--accent);
  color: #fff;
  text-decoration: none;
  padding: 0.75rem 1.15rem;
  border-radius: 0.35rem;
  border: none;
  font: inherit;
  cursor: pointer;
}
section { padding: 2.5rem 0; border-top: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
.ph { aspect-ratio: 4/3; background: color-mix(in srgb, var(--accent) 25%, var(--paper)); border-radius: 0.35rem; }
.banner-test { background: #7a2e0b; color: #fff; padding: 0.65rem 1rem; text-align: center; font-weight: 600; }
.missing { color: var(--muted); font-style: italic; }
.note { font-size: 0.9rem; color: var(--muted); }
.contact label { display: block; margin-bottom: 0.75rem; }
.contact input, .contact textarea { width: 100%; padding: 0.5rem; font: inherit; }
nav { display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem 0; }
footer { padding: 2rem 0 3rem; font-size: 0.9rem; color: var(--muted); }
@media (max-width: 768px) { .hero { padding-top: 2.5rem; } }
`;

  const navLinks =
    cfg.planId === "essentiel"
      ? `<a href="#services">Prestations</a><a href="#contact">Contact</a>`
      : `<a href="index.html">Accueil</a><a href="services.html">Services</a><a href="realisations.html">Réalisations</a><a href="contact.html">Contact</a>`;

  const homeBody = `${testBanner}
<header class="wrap">
  <nav aria-label="Principale">${navLinks}</nav>
</header>
<main>
  <section class="hero wrap">
    <p class="muted">${esc(cfg.tradeSlug)} · ${city}</p>
    <h1>${title}</h1>
    <p>${specialty || "—"}</p>
    ${c.publicPhone ? `<p><a href="tel:${esc(c.publicPhone)}">${esc(c.publicPhone)}</a></p>` : `<p class="missing">Téléphone à confirmer</p>`}
    <p><a class="btn" href="${cfg.planId === "essentiel" ? "#contact" : "contact.html"}">Nous contacter</a></p>
  </section>
  ${has(cfg, "about_company") ? `<section class="wrap" id="about"><h2>À propos</h2><p>${esc(c.aboutText || c.activityDescription || "Texte à valider")}</p></section>` : ""}
  ${has(cfg, "services_list") ? `<section class="wrap" id="services"><h2>Prestations</h2><p>${esc(c.servicesDetail || "Prestations à détailler")}</p></section>` : ""}
  ${has(cfg, "gallery_basic") ? `<section class="wrap" id="realisations"><h2>Réalisations</h2><div class="gallery">${photoPlaceholder}</div></section>` : ""}
  ${has(cfg, "service_area") && c.serviceArea ? `<section class="wrap"><h2>Zone d’intervention</h2><p>${esc(c.serviceArea)}</p></section>` : ""}
  ${estimator}
  ${beforeAfter}
  ${cfg.planId === "essentiel" ? `<section class="wrap" id="contact"><h2>Contact</h2>${c.publicEmail ? `<p><a href="mailto:${esc(c.publicEmail)}">${esc(c.publicEmail)}</a></p>` : ""} ${booking} ${contactForm}</section>` : ""}
</main>
<footer class="wrap">
  <p>${title} — ${city}</p>
  <p>${esc(c.legalMentions || "Mentions légales à compléter")}</p>
  <p class="note">Généré ${esc(cfg.generatedAt)} · template ${esc(cfg.templateVersion)} · config v${cfg.version}</p>
</footer>`;

  pages["styles.css"] = css;
  pages["index.html"] = wrapPage(title, homeBody);

  if (cfg.planId !== "essentiel") {
    pages["services.html"] = wrapPage(
      `${title} — Services`,
      `${testBanner}<header class="wrap"><nav>${navLinks}</nav></header>
<main class="wrap" style="padding:2rem 0"><h1>Services</h1><p>${esc(c.servicesDetail || "À compléter")}</p>
${c.hours ? `<h2>Horaires</h2><p>${esc(c.hours)}</p>` : ""}
${estimator}</main><footer class="wrap"><p><a href="index.html">Accueil</a></p></footer>`,
    );
    pages["realisations.html"] = wrapPage(
      `${title} — Réalisations`,
      `${testBanner}<header class="wrap"><nav>${navLinks}</nav></header>
<main class="wrap" style="padding:2rem 0"><h1>Réalisations</h1>
<div class="gallery">${photoPlaceholder}</div>${beforeAfter}</main>
<footer class="wrap"><p><a href="index.html">Accueil</a></p></footer>`,
    );
    pages["contact.html"] = wrapPage(
      `${title} — Contact`,
      `${testBanner}<header class="wrap"><nav>${navLinks}</nav></header>
<main class="wrap" style="padding:2rem 0"><h1>Contact</h1>
<p>${esc(c.publicAddress || "")}</p>
<p>${c.publicPhone ? esc(c.publicPhone) : ""} ${c.publicEmail ? esc(c.publicEmail) : ""}</p>
${booking}${contactForm}
${has(cfg, "quote_form") ? `<section><h2>Demande de devis</h2><p class="note">Formulaire guidé — backend d’envoi à configurer.</p></section>` : ""}
</main><footer class="wrap"><p><a href="index.html">Accueil</a></p></footer>`,
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
      modules: cfg.modules,
      isTestFixture: cfg.isTestFixture,
      generatedAt: cfg.generatedAt,
    },
    null,
    2,
  );

  pages["README.txt"] = [
    `Site généré pour ${cfg.companyName}`,
    `Formule : ${cfg.planId}`,
    `Template : ${cfg.templateVersion}`,
    cfg.isTestFixture ? "ATTENTION : fixture TEST — ne pas publier comme site client." : "",
    "",
    "Hébergement : le client possède et paie son hébergement.",
    "Formulaires : configurer un service d’envoi réel avant mise en ligne.",
    "Aucun secret Sites Artisans / Supabase n’est inclus dans ce dossier.",
  ]
    .filter(Boolean)
    .join("\n");

  return { files: pages };
}

function wrapPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex,nofollow" />
  <title>${title}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
${body}
</body>
</html>
`;
}
