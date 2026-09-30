import { Link, useLoaderData } from "react-router";
import { requireTrade } from "~/data/trades";
import { tierLabels } from "~/data/offers";
import type { OfferTier } from "~/data/types";

export const meta = ({ data }: { data?: { trade: { label: string } } }) => [
  { title: data ? `Démo ${data.trade.label} — Sites Artisans` : "Démo — Sites Artisans" },
];

export function loader({ params }: { params: { trade?: string } }) {
  return { trade: requireTrade(params.trade ?? "") };
}

const tiers: { tier: OfferTier; path: string; blurb: string }[] = [
  { tier: "essentiel", path: "essentiel", blurb: "Une page complète : services, projets, avis." },
  { tier: "avance", path: "avance", blurb: "Plusieurs pages avec devis guidé et filtres." },
  { tier: "pro", path: "pro", blurb: "Version premium avec estimateur et fiches projet." },
];

export default function DemoTradePicker() {
  const { trade } = useLoaderData<typeof loader>();

  return (
    <section className="section">
      <div className="container">
        <p>
          <Link to="/demos">← Démos</Link>
        </p>
        <h1>{trade.label} — choisir une formule</h1>
        <p className="text-muted">{trade.tagline}</p>
        <div className="grid grid-3" style={{ marginTop: "1.5rem" }}>
          {tiers.map(({ tier, path, blurb }) => (
            <article key={tier} className="card card--interactive">
              <h2>{tierLabels[tier]}</h2>
              <p className="text-muted">{blurb}</p>
              <Link to={`/demos/${trade.slug}/${path}`} className="btn btn-primary">
                Ouvrir la démo
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
