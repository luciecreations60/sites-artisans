import { Link, useOutletContext } from "react-router";
import { BeforeAfter } from "~/components/BeforeAfter";
import type { TradeData } from "~/data/types";
import { artisanName, companyName } from "~/lib/personalize";
import { useDemoHref } from "~/lib/useDemoPaths";

export default function DemoProHome() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const featured = trade.projects[0];
  const hasBa = featured?.before && featured?.after;
  const words = trade.tagline.split(" ");
  const mid = Math.ceil(words.length / 2);
  const contactHref = useDemoHref(trade.slug, "/pro/contact");
  const devisHref = useDemoHref(trade.slug, "/pro/devis");
  const projectHref = useDemoHref(
    trade.slug,
    `/pro/realisations/${featured?.id ?? "p1"}`,
  );

  return (
    <main>
      <section className="r-hero">
        <div className="container hero-fade">
          <p className="r-label">
            {companyName(trade)} · {trade.label}
          </p>
          <h1>
            {words.slice(0, mid).join(" ")}{" "}
            <span>{words.slice(mid).join(" ")}</span>
          </h1>
          <p className="lead" style={{ color: "var(--r-muted)", maxWidth: "40ch" }}>
            {trade.specialty}
          </p>
          <div className="hero-actions">
            <Link to={contactHref} className="btn btn-primary">
              Prendre rendez-vous
            </Link>
            <Link to={devisHref} className="btn btn-ghost">
              Estimation en ligne
            </Link>
          </div>
        </div>
      </section>
      {hasBa && featured.before && featured.after && (
        <section className="section section--tight">
          <div className="container">
            <p className="r-label">Avant / après</p>
            <h2 style={{ textTransform: "none", fontWeight: 700 }}>{featured.title}</h2>
            <BeforeAfter before={featured.before} after={featured.after} />
          </div>
        </section>
      )}
      <section className="section" style={{ background: "var(--r-bg2)" }}>
        <div className="container grid grid-2" style={{ alignItems: "center" }}>
          <img
            src={trade.atelier.src}
            alt={trade.atelier.alt}
            style={{ borderRadius: 0, objectFit: "cover", minHeight: "320px", width: "100%" }}
          />
          <div>
            <p className="r-label">L’atelier</p>
            <h2 style={{ textTransform: "none", fontWeight: 700 }}>{artisanName(trade)}</h2>
            <p style={{ color: "var(--r-muted)" }}>{trade.about}</p>
            <Link to={projectHref} className="btn btn-ghost">
              Voir le projet en détail
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
