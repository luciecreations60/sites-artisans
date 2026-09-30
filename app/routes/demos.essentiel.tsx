import { Link, useLoaderData } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { TradeTheme } from "~/components/TradeTheme";
import { requireTrade } from "~/data/trades";
import { artisanName, companyName } from "~/lib/personalize";
import { formatPhone } from "~/lib/format";
import { useAppliedTrade } from "~/lib/useAppliedTrade";

export function loader({ params }: { params: { trade?: string } }) {
  return { trade: requireTrade(params.trade ?? "") };
}

export default function DemoEssentiel() {
  const { trade: base } = useLoaderData<typeof loader>();
  const trade = useAppliedTrade(base);

  return (
    <TradeTheme trade={trade}>
      <DemoChrome tradeLabel={trade.label} tier="essentiel" />
      <header className="section section--tight">
        <div className="container hero-fade">
          <p className="text-muted">{companyName(trade)} · {trade.defaultCity}</p>
          <h1>{trade.tagline}</h1>
          <p>{trade.specialty}</p>
          <img
            src={trade.hero.src}
            alt={trade.hero.alt}
            style={{ borderRadius: "var(--radius)", marginTop: "1rem", width: "100%", maxHeight: "420px", objectFit: "cover" }}
          />
        </div>
      </header>

      <section className="section">
        <div className="container grid grid-2">
          <div>
            <h2>À propos</h2>
            <p>{trade.about}</p>
            <p>
              <strong>{artisanName(trade)}</strong>
            </p>
          </div>
          <img src={trade.atelier.src} alt={trade.atelier.alt} style={{ borderRadius: "var(--radius)", objectFit: "cover" }} />
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <h2>Services</h2>
          <ul className="grid grid-2" style={{ listStyle: "none", padding: 0 }}>
            {trade.services.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                {s.priceFrom && <> — <span className="text-muted">dès {s.priceFrom}</span></>}
                <p className="text-muted" style={{ margin: "0.25rem 0 0" }}>{s.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Réalisations</h2>
          <div className="grid grid-3">
            {trade.projects.slice(0, 3).map((p) => (
              <figure key={p.id}>
                <img src={p.image.src} alt={p.image.alt} style={{ borderRadius: "var(--radius)", aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
                <figcaption>
                  <strong>{p.title}</strong>
                  <p className="text-muted" style={{ margin: 0, fontSize: "0.9375rem" }}>{p.summary}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: "var(--surface)" }}>
        <div className="container">
          <h2>Avis clients</h2>
          <div className="grid grid-3">
            {trade.testimonials.map((t) => (
              <blockquote key={t.name} className="card" style={{ margin: 0 }}>
                <p style={{ margin: 0 }}>« {t.text} »</p>
                <footer className="text-muted" style={{ marginTop: "0.75rem", fontSize: "0.9375rem" }}>
                  — {t.name}, {t.city}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container text-center">
          <h2>Contact</h2>
          <p>
            <a href={`tel:${trade.defaultPhone.replace(/\s/g, "")}`}>{formatPhone(trade.defaultPhone)}</a>
            {" · "}
            <a href={`mailto:${trade.defaultEmail}`}>{trade.defaultEmail}</a>
          </p>
          <Link to={`/demos/${trade.slug}/avance/contact`} className="btn btn-primary">
            Demander un devis (démo Avancé)
          </Link>
        </div>
      </section>
    </TradeTheme>
  );
}
