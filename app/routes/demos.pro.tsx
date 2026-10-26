import { Link, useOutletContext } from "react-router";
import { BeforeAfter, BeforeAfterPlaceholder } from "~/components/BeforeAfter";
import { DemoModulesNote } from "~/components/DemoModulesNote";
import type { TradeData } from "~/data/types";
import { demoCopy } from "~/lib/demoCopy";
import { artisanName, companyName } from "~/lib/personalize";
import { useDemoBasePath, useDemoHref, useDemoSearch } from "~/lib/useDemoPaths";
import { useDemoModules } from "~/lib/templates/useDemoModules";

/** Accueil Pro — expérience premium immersive, modules avancés. */
export default function DemoProHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const copy = demoCopy(trade);
  const featured = trade.projects.find((p) => p.before && p.after) ?? trade.projects[0];
  const hasBa = Boolean(featured?.before && featured?.after);
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();
  const contactHref = useDemoHref(trade.slug, "/pro/contact");
  const devisHref = useDemoHref(trade.slug, "/pro/devis");
  const servicesHref = useDemoHref(trade.slug, "/pro/services");
  const realisationsHref = useDemoHref(trade.slug, "/pro/realisations");
  const projectHref = useDemoHref(
    trade.slug,
    `/pro/realisations/${featured?.id ?? "p1"}`,
  );
  const modules = useDemoModules("pro");

  return (
    <main className="r-home">
      <DemoModulesNote modules={modules} />
      <section className="r-hero">
        <div
          className="r-hero__bg"
          style={{ backgroundImage: `url(${trade.hero.src})` }}
          aria-hidden
        />
        <div className="container r-hero__content hero-fade">
          <p className="r-label">
            {companyName(trade)} · {trade.label}
          </p>
          <h1>{trade.tagline}</h1>
          <p className="r-hero__lead">{copy.heroLead}</p>
          <div className="hero-actions">
            <Link to={contactHref} className="btn btn-primary">
              {copy.contactCta}
            </Link>
            {modules.estimator || modules.quote_form ? (
              <Link to={devisHref} className="btn btn-ghost">
                {modules.estimator ? "Estimation en ligne" : copy.quoteCta}
              </Link>
            ) : (
              <Link to={realisationsHref} className="btn btn-ghost">
                {copy.galleryCta}
              </Link>
            )}
          </div>
        </div>
      </section>

      {modules.gallery_before_after && (
        <section className="section section--tight r-ba">
          <div className="container">
            <p className="r-label">Avant / après</p>
            <h2>{featured?.title ?? "Transformation"}</h2>
            {hasBa && featured?.before && featured?.after ? (
              <BeforeAfter
                before={featured.before}
                after={featured.after}
                illustrative
                caption={copy.beforeAfterCaption}
              />
            ) : (
              <BeforeAfterPlaceholder />
            )}
          </div>
        </section>
      )}

      <section className="r-atelier">
        <div className="container r-atelier__grid">
          <div>
            <p className="r-label">{copy.placeLabel}</p>
            <h2>{artisanName(trade)}</h2>
            <p>{trade.about}</p>
            <div className="hero-actions">
              <Link to={projectHref} className="btn btn-ghost">
                {copy.projectDetailCta}
              </Link>
              <Link to={servicesHref} className="btn btn-outline">
                Prestations
              </Link>
            </div>
          </div>
          <img src={trade.atelier.src} alt={trade.atelier.alt} loading="lazy" />
        </div>
      </section>

      <section className="r-showcase">
        <div className="container">
          <div className="r-showcase__head">
            <h2>{copy.galleryHeading} sélectionnées</h2>
            <Link to={realisationsHref}>Galerie complète →</Link>
          </div>
          <div className="r-showcase__grid">
            {trade.projects.slice(0, 3).map((p, i) => (
              <Link
                key={p.id}
                to={`${basePath}/pro/realisations/${p.id}${q}`}
                className={`r-showcase__card r-showcase__card--${i + 1}`}
              >
                <img src={p.image.src} alt={p.image.alt} loading="lazy" />
                <span>
                  <strong>{p.title}</strong>
                  <em>{p.location}</em>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {modules.estimator && (
        <section className="r-estimator-cta">
          <div className="container r-estimator-cta__inner">
            <div>
              <p className="r-label">Outil métier</p>
              <h2>Estimateur indicatif</h2>
              <p>Fourchette non contractuelle — barème de démonstration à personnaliser.</p>
            </div>
            <Link to={devisHref} className="btn btn-primary">
              Essayer l’estimateur
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
