import { Link, useOutletContext } from "react-router";
import type { TradeData } from "~/data/types";
import { demoCopy } from "~/lib/demoCopy";
import { getServiceImage } from "~/lib/demoMedia";
import { useDemoHref } from "~/lib/useDemoPaths";

export default function DemoProServices() {
  const { trade } = useOutletContext<{ trade: TradeData }>();
  const copy = demoCopy(trade);
  const devisHref = useDemoHref(trade.slug, "/pro/devis");

  return (
    <main className="section">
      <div className="container">
        <h1>Expertise & prestations</h1>
        <p className="text-muted">
          Chaque prestation a sa propre photo, distincte de la {copy.galleryHeading.toLowerCase()}.
        </p>
        {trade.services.map((s, i) => {
          const media = getServiceImage(trade, i);
          return (
            <article key={s.title} className="r-service-row">
              <div className="r-service-row__copy">
                <h2>{s.title}</h2>
                {s.priceFrom && <p className="text-muted">Indicatif dès {s.priceFrom}</p>}
                <p>{s.description}</p>
                <Link to={devisHref} className="btn btn-primary">
                  {copy.estimateCta}
                </Link>
              </div>
              <img
                className="r-service-row__media"
                src={media.src}
                alt={media.alt}
                loading="lazy"
              />
            </article>
          );
        })}
      </div>
    </main>
  );
}
