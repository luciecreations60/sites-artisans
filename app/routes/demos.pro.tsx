import { Link, useOutletContext } from "react-router";
import { BeforeAfter } from "~/components/BeforeAfter";
import type { TradeData } from "~/data/types";
import { artisanName, companyName } from "~/lib/personalize";

export default function DemoProHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const featured = trade.projects[0];
  const hasBa = featured?.before && featured?.after;

  return (
    <main>
      <section
        className="section"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, var(--accent) 15%, var(--paper)), var(--paper))`,
        }}
      >
        <div className="container hero-fade">
          <p className="text-muted">{companyName(trade)}</p>
          <h1 style={{ fontSize: "clamp(2.25rem, 5vw, 3.25rem)" }}>{trade.tagline}</h1>
          <p className="lead">{trade.specialty}</p>
          <div className="hero-actions">
            <Link to={`/demos/${trade.slug}/pro/contact`} className="btn btn-primary">
              Prendre rendez-vous
            </Link>
            <Link to={`/demos/${trade.slug}/pro/devis`} className="btn btn-ghost">
              Estimation en ligne
            </Link>
          </div>
        </div>
      </section>
      {hasBa && featured.before && featured.after && (
        <section className="section section--tight">
          <div className="container">
            <h2>Avant / après — {featured.title}</h2>
            <BeforeAfter before={featured.before} after={featured.after} />
          </div>
        </section>
      )}
      <section className="section">
        <div className="container grid grid-2">
          <img
            src={trade.hero.src}
            alt={trade.hero.alt}
            style={{ borderRadius: "var(--radius)", objectFit: "cover", minHeight: "280px" }}
          />
          <div>
            <h2>{artisanName(trade)}</h2>
            <p>{trade.about}</p>
            <Link to={`/demos/${trade.slug}/pro/realisations/${featured?.id ?? "p1"}`} className="btn btn-ghost">
              Voir le projet en détail
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
