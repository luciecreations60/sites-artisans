import { Link, Outlet, useLoaderData, useLocation, Navigate } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { TradeTheme } from "~/components/TradeTheme";
import type { TradeData } from "~/data/types";
import { applyTierMedia } from "~/lib/demoMedia";
import { companyName } from "~/lib/personalize";
import { useProspectDemo } from "~/lib/ProspectDemoContext";
import { demoTradeLoader, useResolveDemoTrade } from "~/lib/resolveDemoTrade";
import { useAppliedTrade } from "~/lib/useAppliedTrade";
import { useDemoBasePath, useDemoSearch } from "~/lib/useDemoPaths";

export function loader({ params }: { params: { trade?: string } }) {
  return demoTradeLoader(params);
}

const nav = [
  { path: "avance", label: "Accueil" },
  { path: "avance/services", label: "Services" },
  { path: "avance/realisations", label: "Réalisations" },
  { path: "avance/devis", label: "Devis" },
  { path: "avance/contact", label: "Contact" },
];

export default function DemoAvanceLayout() {
  const data = useLoaderData() as { trade: TradeData | null } | undefined;
  const base = useResolveDemoTrade(data?.trade ?? null);
  const trade = applyTierMedia(useAppliedTrade(base), "avance");
  const location = useLocation();
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();
  const prospect = useProspectDemo();

  if (prospect && !prospect.enabledTiers.includes("avance")) {
    return <Navigate to={`${basePath}${q}`} replace />;
  }

  return (
    <TradeTheme trade={trade} className="sg-shell">
      <DemoChrome tradeLabel={trade.label} tradeSlug={trade.slug} tier="avance" />
      <div className="container">
        <div className="sg-topbar">
          <p className="sg-topbar__brand" style={{ margin: 0 }}>
            {companyName(trade)}
          </p>
          <p className="text-muted" style={{ margin: 0 }}>
            {trade.defaultCity} · {trade.label}
          </p>
        </div>
        <nav className="demo-nav" aria-label="Navigation démo">
          {nav.map((item) => {
            const href = `${basePath}/${item.path}${q}`;
            const active =
              location.pathname === `${basePath}/${item.path}` ||
              location.pathname === `${basePath}/${item.path}/`;
            return (
              <Link key={item.path} to={href} className={active ? "active" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Outlet context={{ trade }} />
    </TradeTheme>
  );
}
