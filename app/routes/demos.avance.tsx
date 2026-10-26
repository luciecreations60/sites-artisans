import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { demoCopy } from "~/lib/demoCopy";
import { artisanName, companyName } from "~/lib/personalize";
import { useDemoHref } from "~/lib/useDemoPaths";
import { useDemoModules } from "~/lib/templates/useDemoModules";
import { DemoModulesNote } from "~/components/DemoModulesNote";

/** Accueil Avancé — éditorial multipage, compositions enrichies. */
export default function DemoAvanceHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const devisHref = useDemoHref(trade.slug, "/avance/devis");
  const realisationsHref = useDemoHref(trade.slug, "/avance/realisations");
  const servicesHref = useDemoHref(trade.slug, "/avance/services");
  const contactHref = useDemoHref(trade.slug, "/avance/contact");
  const modules = useDemoModules("avance");
  const copy = demoCopy(trade);

  return (
    <main>
      <DemoModulesNote modules={modules} />
      <section className="container sg-hero hero-fade">
        <div className="sg-hero__copy">
          <p className="sg-kicker">{trade.label} · {companyName(trade)}</p>
          <h1>{trade.tagline}</h1>
          <p className="lead">{trade.specialty}</p>
          <p className="sg-hero__intro">{copy.heroLead}</p>
          <p className="sg-hero__byline">
            <strong>{artisanName(trade)}</strong> — {trade.defaultCity}
          </p>
          <div className="hero-actions">
            {modules.quote_form ? (
              <Link to={devisHref} className="btn btn-primary">
                {copy.quoteCta}
              </Link>
            ) : (
              <Link to={contactHref} className="btn btn-primary">
                {copy.contactCta}
              </Link>
            )}
            <Link to={realisationsHref} className="btn btn-ghost">
              {copy.galleryCta}
            </Link>
          </div>
        </div>
        <div className="sg-hero__media">
          <img src={trade.hero.src} alt={trade.hero.alt} loading="eager" />
          <img className="sg-hero__overlap" src={trade.atelier.src} alt={trade.atelier.alt} loading="lazy" />
        </div>
      </section>

      <section className="sg-split">
        <div className="container sg-split__grid">
          <img src={trade.portrait.src} alt={trade.portrait.alt} loading="lazy" />
          <div>
            <p className="sg-kicker">Savoir-faire</p>
            <h2>Une présentation plus complète de votre entreprise</h2>
            <p>{trade.about}</p>
            <Link to={servicesHref} className="btn btn-outline">
              Découvrir les prestations
            </Link>
          </div>
        </div>
      </section>

      <section className="sg-services-teaser">
        <div className="container">
          <div className="sg-services-teaser__head">
            <h2>Prestations</h2>
            <Link to={servicesHref}>Toutes les prestations →</Link>
          </div>
          <div className="sg-service-cards">
            {trade.services.slice(0, 3).map((s, i) => (
              <article key={s.title} className={`sg-service-card sg-service-card--${(i % 3) + 1}`}>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                {s.priceFrom && <span>dès {s.priceFrom}</span>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-projects-band">
        <div className="container">
          <div className="sg-services-teaser__head">
            <h2>{copy.galleryHeading}</h2>
            <Link to={realisationsHref}>
              {modules.gallery_filtered ? "Galerie filtrable →" : "Voir tout →"}
            </Link>
          </div>
          <div className="sg-project-row">
            {trade.projects.slice(0, 4).map((p) => (
              <figure key={p.id}>
                <img src={p.image.src} alt={p.image.alt} loading="lazy" />
                <figcaption>
                  <strong>{p.title}</strong>
                  <span>{p.location}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {modules.service_area && (
        <section className="container sg-area">
          <h2>{copy.areaTitle}</h2>
          <p>{copy.areaText(trade.defaultCity)}</p>
        </section>
      )}

      <section className="sg-cta-band">
        <div className="container sg-cta-band__inner">
          <div>
            <h2>{copy.contactTitle}</h2>
            <p>Formulaire guidé et pages dédiées — formule Avancé.</p>
          </div>
          <Link
            to={modules.quote_form ? devisHref : contactHref}
            className="btn btn-primary"
          >
            {modules.quote_form ? copy.quoteCta : copy.contactCta}
          </Link>
        </div>
      </section>
    </main>
  );
}
