import { Link } from "react-router";
import { tierLabels } from "~/data/offers";
import { requireTrade } from "~/data/trades";
import type { OfferTier } from "~/data/types";
import { useProspectDemo } from "~/lib/ProspectDemoContext";
import { demoDisplayCompany } from "~/lib/prospectDemo";
import { useDemoSearch } from "~/lib/useDemoPaths";

const blurbs: Record<OfferTier, string> = {
  essentiel: "Une page complète : services, projets, avis.",
  avance: "Plusieurs pages avec devis guidé et filtres.",
  pro: "Version premium avec estimateur et fiches projet.",
};

export const meta = () => [{ title: "Démo personnalisée — Sites Artisans" }];

export default function ProspectDemoHub() {
  const prospect = useProspectDemo();
  const q = useDemoSearch();
  if (!prospect) return null;

  const { demo, enabledTiers } = prospect;
  let tradeLabel = demo.trade_slug;
  try {
    tradeLabel = requireTrade(demo.trade_slug).label;
  } catch {
    /* ignore */
  }

  return (
    <section className="section">
      <div className="container">
        <h1>{demoDisplayCompany(demo)}</h1>
        <p className="text-muted">
          {tradeLabel}
          {demo.city ? ` · ${demo.city}` : ""}
          {prospect.isPreview ? " · Aperçu admin" : ""}
        </p>
        <p>Choisissez une formule pour découvrir le site personnalisé.</p>
        <div className="grid grid-3" style={{ marginTop: "1.5rem" }}>
          {enabledTiers.map((tier) => (
            <article key={tier} className="card card--interactive">
              <h2>{tierLabels[tier]}</h2>
              <p className="text-muted">{blurbs[tier]}</p>
              <Link
                to={`/demo/${demo.public_slug}/${tier === "essentiel" ? "essentiel" : tier}${q}`}
                className="btn btn-primary"
              >
                Ouvrir la démo
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
