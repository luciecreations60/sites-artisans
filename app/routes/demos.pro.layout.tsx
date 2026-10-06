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
  { path: "pro", label: "Accueil" },
  { path: "pro/services", label: "Services" },
  { path: "pro/realisations", label: "Réalisations" },
  { path: "pro/devis", label: "Devis & estimation" },
  { path: "pro/contact", label: "RDV & contact" },
];

export default function DemoProLayout() {
  const data = useLoaderData() as { trade: TradeData | null } | undefined;
  const base = useResolveDemoTrade(data?.trade ?? null);
  const trade = applyTierMedia(useAppliedTrade(base), "pro");
  const location = useLocation();
  const basePath = useDemoBasePath(trade.slug);
  const q = useDemoSearch();
  const prospect = useProspectDemo();

  if (prospect && !prospect.enabledTiers.includes("pro")) {
    return <Navigate to={`${basePath}${q}`} replace />;
  }

  return (
    <TradeTheme trade={trade} className="r-shell">
      <DemoChrome tradeLabel={trade.label} tradeSlug={trade.slug} tier="pro" />
      <div className="container">
        <div className="r-topbar">{companyName(trade)}</div>
        <nav className="demo-nav" aria-label="Navigation démo Pro">
          {nav.map((item) => {
            const href = `${basePath}/${item.path}${q}`;
            const active =
              item.path === "pro"
                ? location.pathname === `${basePath}/pro` ||
                  location.pathname === `${basePath}/pro/`
                : location.pathname.startsWith(`${basePath}/${item.path}`);
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
