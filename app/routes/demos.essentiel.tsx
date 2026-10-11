import { Link, Navigate, useLoaderData } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { DemoModulesNote } from "~/components/DemoModulesNote";
import { TradeTheme } from "~/components/TradeTheme";
import type { TradeData } from "~/data/types";
import { applyTierMedia } from "~/lib/demoMedia";
import { artisanName, companyName } from "~/lib/personalize";
import { formatPhone } from "~/lib/format";
import { useProspectDemo } from "~/lib/ProspectDemoContext";
import { demoTradeLoader, useResolveDemoTrade } from "~/lib/resolveDemoTrade";
import { useAppliedTrade } from "~/lib/useAppliedTrade";
import { useDemoHref, useDemoBasePath, useDemoSearch } from "~/lib/useDemoPaths";
import { useDemoModules } from "~/lib/templates/useDemoModules";

export function loader({ params }: { params: { trade?: string } }) {
  return demoTradeLoader(params);
}

/** Template Essentiel — vitrine one-page claire, sobre, paramétrable. */
export default function DemoEssentiel() {
  const data = useLoaderData() as { trade: TradeData | null } | undefined;
  const base = useResolveDemoTrade(data?.trade ?? null);
  const trade = applyTierMedia(useAppliedTrade(base), "essentiel");
  const avanceContactHref = useDemoHref(trade.slug, "/avance/contact");
  const configurateurHref = `/configurateur?metier=${trade.slug}&formule=essentiel&parcours=formula`;
  const prospect = useProspectDemo();
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();
  const modules = useDemoModules("essentiel");

  if (prospect && !prospect.enabledTiers.includes("essentiel")) {
    return <Navigate to={`${basePath}${q}`} replace />;
  }

  return (
    <TradeTheme trade={trade} className="e-shell">
      <DemoChrome tradeLabel={trade.label} tradeSlug={trade.slug} tier="essentiel" />
      <DemoModulesNote modules={modules} />
      <div className="container e-page">
        <header className="e-topbar">
          <div>
            <p className="e-topbar__brand">{companyName(trade)}</p>
            <p className="e-topbar__meta">
              {trade.label} · {trade.defaultCity}
            </p>
          </div>
          <a className="btn btn-primary" href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
            Appeler
          </a>
        </header>

        <section className="e-hero hero-fade">
          <div className="e-hero__copy">
            <p className="eyebrow">{trade.specialty}</p>
            <h1>{trade.tagline}</h1>
            <p className="lead e-hero__lead">
              Un site vitrine simple pour présenter votre activité, vos prestations et vos
              coordonnées — adapté à {trade.labelPlural.toLowerCase()}.
            </p>
            <div className="e-chips" aria-label="Prestations mises en avant">
              {trade.services.slice(0, 3).map((s) => (
                <span key={s.title} className="e-chip">
                  {s.title}
                </span>
              ))}
            </div>
            <div className="hero-actions">
              <a href="#contact" className="btn btn-primary">
                Me contacter
              </a>
              <a href="#realisations" className="btn btn-ghost">
                Voir les réalisations
              </a>
            </div>
          </div>
          <div className="e-hero__media">
            <img src={trade.hero.src} alt={trade.hero.alt} loading="eager" />
          </div>
        </section>

        {modules.about_company && (
          <section className="e-about" id="apropos">
            <div className="e-about__grid">
              <div>
                <h2>À propos</h2>
                <p>{trade.about}</p>
                <p className="e-about__name">
                  <strong>{artisanName(trade)}</strong>
                  <span>
                    {trade.defaultCity} — démonstration illustrative
                  </span>
                </p>
              </div>
              <img
                className="media-rounded"
                src={trade.atelier.src}
                alt={trade.atelier.alt}
                loading="lazy"
              />
            </div>
          </section>
        )}

        {modules.services_list && (
          <section className="e-band" id="services">
            <div className="container e-band__inner">
              <h2>Prestations</h2>
              <div className="e-services">
                {trade.services.map((s) => (
                  <article key={s.title} className="e-service">
                    <h3>{s.title}</h3>
                    {s.priceFrom && (
                      <p className="e-service__price">Indicatif dès {s.priceFrom}</p>
                    )}
                    <p>{s.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {modules.gallery_basic && (
          <section className="e-work" id="realisations">
            <h2>Réalisations</h2>
            <p className="text-muted e-section-intro">
              Exemples illustratifs pour la démonstration — à remplacer par vos photos.
            </p>
            <div className="e-gallery">
              {trade.projects.slice(0, 3).map((p) => (
                <figure key={p.id}>
                  <img src={p.image.src} alt={p.image.alt} loading="lazy" />
                  <figcaption>
                    <strong>{p.title}</strong>
                    <span>{p.summary}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {modules.service_area && (
          <section className="e-area">
            <h2>Zone d’intervention</h2>
            <p>
              Intervention autour de <strong>{trade.defaultCity}</strong> et communes voisines.
            </p>
          </section>
        )}

        {modules.testimonials && (
          <section className="e-band e-band--soft" id="avis">
            <div className="container e-band__inner">
              <h2>Ils en parlent</h2>
              <p className="text-muted e-section-intro">
                Témoignages d’exemple pour la démo — non attribués à de vrais clients.
              </p>
              <div className="e-quotes">
                {trade.testimonials.map((t) => (
                  <blockquote key={t.name}>
                    <p>« {t.text} »</p>
                    <footer>
                      — {t.name}, {t.city}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="e-contact" id="contact">
          <div className="e-contact-cta">
            <h2>Parlons de votre projet</h2>
            <p>
              <a href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
                {formatPhone(trade.defaultPhone)}
              </a>
              {" · "}
              <a href={`mailto:${trade.defaultEmail}`}>{trade.defaultEmail}</a>
            </p>
            <div className="hero-actions">
              <Link to={avanceContactHref} className="btn btn-primary">
                Voir la demande de devis (Avancé)
              </Link>
              <Link to={configurateurHref} className="btn btn-ghost">
                Revenir au configurateur
              </Link>
            </div>
          </div>
        </section>
      </div>
    </TradeTheme>
  );
}
