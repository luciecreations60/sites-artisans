import { useLocation, Link } from "react-router";
import { useState } from "react";
import type { OfferTier, TradeSlug } from "~/data/types";
import { tierLabels } from "~/data/offers";
import { BackToTop } from "~/components/BackToTop";
import { Personalizer } from "~/components/Personalizer";
import { switchDemoTier } from "~/lib/demoMedia";
import { useProspectDemo } from "~/lib/ProspectDemoContext";
import {
  configuratorHrefFromDemo,
  persistDemoEntry,
  UX_LABELS,
} from "~/lib/configurator/bridge";
import { TRADE_SLUGS } from "~/data/trades";

type Props = {
  tradeLabel: string;
  tradeSlug: string;
  tier: OfferTier;
};

const ALL_TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

function isTradeSlug(value: string): value is TradeSlug {
  return (TRADE_SLUGS as string[]).includes(value);
}

export function DemoChrome({ tradeLabel, tradeSlug, tier }: Props) {
  const [showPersonalizer, setShowPersonalizer] = useState(false);
  const location = useLocation();
  const prospect = useProspectDemo();

  const pathSlug = prospect ? prospect.demo.public_slug : tradeSlug;
  const basePrefix = prospect ? "/demo" : "/demos";
  const tiers = prospect ? prospect.enabledTiers : ALL_TIERS;
  const previewQ = prospect?.isPreview ? "?preview=1" : "";

  const onPersonalize = () => {
    if (isTradeSlug(tradeSlug)) {
      persistDemoEntry(tradeSlug, tier);
    }
  };

  return (
    <div className="demo-chrome">
      {prospect?.isPreview && (
        <div className="demo-chrome__preview-banner" role="status">
          Aperçu admin — non public · les vues ne sont pas comptabilisées
        </div>
      )}
      <div className="container demo-chrome__inner">
        <div className="demo-chrome__left">
          <p style={{ margin: 0 }}>
            {prospect ? (
              <>
                <Link to={`/demo/${pathSlug}${previewQ}`}>Démo personnalisée</Link>
                {" · "}
                {tierLabels[tier]} — {tradeLabel}
              </>
            ) : (
              <>
                <Link to="/demos">{UX_LABELS.gallery}</Link>
                {" · "}
                {tierLabels[tier]} — {tradeLabel}
              </>
            )}
          </p>
          <div className="demo-tier-switch" role="navigation" aria-label={UX_LABELS.comparePlans}>
            {tiers.map((t) => (
              <Link
                key={t}
                to={
                  switchDemoTier(location.pathname, pathSlug, tier, t, basePrefix) + previewQ
                }
                className={t === tier ? "is-active" : undefined}
                aria-current={t === tier ? "page" : undefined}
                onClick={() => {
                  if (!prospect && isTradeSlug(tradeSlug)) {
                    persistDemoEntry(tradeSlug, t);
                  }
                }}
              >
                {tierLabels[t]}
              </Link>
            ))}
          </div>
        </div>
        <p style={{ margin: 0, opacity: 0.85 }}>
          {prospect ? (
            "Démonstration personnalisée"
          ) : (
            <>
              Contenu illustratif ·{" "}
              <Link
                to={configuratorHrefFromDemo(tradeSlug, tier)}
                className="btn btn-ghost"
                style={{
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.8125rem",
                  color: "#fff",
                  borderColor: "#ffffff55",
                }}
                onClick={onPersonalize}
              >
                {UX_LABELS.personalizeModel}
              </Link>
              {" · "}
              <Link
                to={configuratorHrefFromDemo(tradeSlug, tier, { step: 5 })}
                className="btn btn-ghost"
                style={{
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.8125rem",
                  color: "#fff",
                  borderColor: "#ffffff55",
                }}
                onClick={onPersonalize}
              >
                {UX_LABELS.backToConfig}
              </Link>
              {" · "}
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  padding: "0.2rem 0.5rem",
                  fontSize: "0.8125rem",
                  color: "#fff",
                  borderColor: "#ffffff55",
                }}
                onClick={() => setShowPersonalizer((v) => !v)}
              >
                {showPersonalizer ? "Masquer" : UX_LABELS.adjustPreview}
              </button>
            </>
          )}
        </p>
      </div>
      {!prospect && showPersonalizer && (
        <div className="container" style={{ paddingBottom: "0.75rem" }}>
          <Personalizer compact variant="light" />
        </div>
      )}
      <BackToTop />
    </div>
  );
}
