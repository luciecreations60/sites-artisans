import { Link, useLoaderData } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { TradeTheme } from "~/components/TradeTheme";
import { requireTrade } from "~/data/trades";
import { applyTierMedia } from "~/lib/demoMedia";
import { artisanName, companyName } from "~/lib/personalize";
import { formatPhone } from "~/lib/format";
import { useAppliedTrade } from "~/lib/useAppliedTrade";

export function loader({ params }: { params: { trade?: string } }) {
  return { trade: requireTrade(params.trade ?? "") };
}

export default function DemoEssentiel() {
  const { trade: base } = useLoaderData<typeof loader>();
  const trade = applyTierMedia(useAppliedTrade(base), "essentiel");

  return (
    <TradeTheme trade={trade} className="e-shell">
      <DemoChrome tradeLabel={trade.label} tradeSlug={trade.slug} tier="essentiel" />
      <div className="container">
        <div className="e-topbar">
          <div>
            <p className="e-topbar__brand" style={{ margin: 0 }}>
              {companyName(trade)}
            </p>
            <p className="text-muted" style={{ margin: "0.2rem 0 0", fontSize: "0.9rem" }}>
              {trade.defaultCity}
            </p>
          </div>
          <a className="btn btn-primary" href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
            Appeler
          </a>
        </div>

        <section className="e-hero hero-fade">
          <div>
            <p className="eyebrow">{trade.label}</p>
            <h1>{trade.tagline}</h1>
            <p className="lead">{trade.specialty}</p>
            <div className="e-chips">
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
            <img src={trade.hero.src} alt={trade.hero.alt} />
          </div>
        </section>

        <section className="section">
          <div className="grid grid-2" style={{ alignItems: "center" }}>
            <div>
              <h2>À propos</h2>
              <p>{trade.about}</p>
              <p>
                <strong>{artisanName(trade)}</strong>
              </p>
            </div>
            <img
              className="media-rounded"
              src={trade.atelier.src}
              alt={trade.atelier.alt}
              style={{ aspectRatio: "4/3" }}
            />
          </div>
        </section>

        <section className="section" style={{ background: "var(--surface)", marginInline: "calc(50% - 50vw)", paddingInline: "max(24px, calc((100vw - 1180px) / 2 + 24px))" }}>
          <h2>Services</h2>
          <div className="grid grid-2" style={{ marginTop: "1.25rem" }}>
            {trade.services.map((s) => (
              <article key={s.title} className="e-service">
                <h3 style={{ marginBottom: "0.35rem" }}>{s.title}</h3>
                {s.priceFrom && (
                  <p className="text-muted" style={{ margin: "0 0 0.5rem", fontSize: "0.9rem" }}>
                    dès {s.priceFrom}
                  </p>
                )}
                <p className="text-muted" style={{ margin: 0 }}>
                  {s.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="realisations">
          <h2>Réalisations</h2>
          <div className="grid grid-3" style={{ marginTop: "1.25rem" }}>
            {trade.projects.slice(0, 3).map((p) => (
              <figure key={p.id} style={{ margin: 0 }}>
                <img
                  className="media-rounded"
                  src={p.image.src}
                  alt={p.image.alt}
                  style={{ aspectRatio: "4/3" }}
                />
                <figcaption style={{ marginTop: "0.65rem" }}>
                  <strong>{p.title}</strong>
                  <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem" }}>
                    {p.summary}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="section" style={{ background: "var(--surface)", marginInline: "calc(50% - 50vw)", paddingInline: "max(24px, calc((100vw - 1180px) / 2 + 24px))" }}>
          <h2>Avis clients</h2>
          <div className="grid grid-3" style={{ marginTop: "1.25rem" }}>
            {trade.testimonials.map((t) => (
              <blockquote key={t.name} className="card" style={{ margin: 0 }}>
                <p style={{ margin: 0 }}>« {t.text} »</p>
                <footer className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.9375rem" }}>
                  — {t.name}, {t.city}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="section" id="contact">
          <div className="e-contact-cta">
            <h2 style={{ color: "#faf5ec" }}>Parlons de votre projet</h2>
            <p style={{ color: "rgba(250,245,236,.75)" }}>
              <a href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>
                {formatPhone(trade.defaultPhone)}
              </a>
              {" · "}
              <a href={`mailto:${trade.defaultEmail}`}>{trade.defaultEmail}</a>
            </p>
            <Link to={`/demos/${trade.slug}/avance/contact`} className="btn btn-primary">
              Demander un devis (démo Avancé)
            </Link>
          </div>
        </section>
      </div>
    </TradeTheme>
  );
}
