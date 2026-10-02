import { Link, Outlet, useLoaderData, useLocation } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { TradeTheme } from "~/components/TradeTheme";
import { requireTrade } from "~/data/trades";
import { applyTierMedia } from "~/lib/demoMedia";
import { companyName } from "~/lib/personalize";
import { useAppliedTrade } from "~/lib/useAppliedTrade";

export function loader({ params }: { params: { trade?: string } }) {
  return { trade: requireTrade(params.trade ?? "") };
}

const nav = [
  { path: "pro", label: "Accueil" },
  { path: "pro/services", label: "Services" },
  { path: "pro/realisations", label: "Réalisations" },
  { path: "pro/devis", label: "Devis & estimation" },
  { path: "pro/contact", label: "RDV & contact" },
];

export default function DemoProLayout() {
  const { trade: base } = useLoaderData<typeof loader>();
  const trade = applyTierMedia(useAppliedTrade(base), "pro");
  const location = useLocation();
  const basePath = `/demos/${trade.slug}`;

  return (
    <TradeTheme trade={trade} className="r-shell">
      <DemoChrome tradeLabel={trade.label} tradeSlug={trade.slug} tier="pro" />
      <div className="container">
        <div className="r-topbar">{companyName(trade)}</div>
        <nav className="demo-nav" aria-label="Navigation démo Pro">
          {nav.map((item) => {
            const href = `${basePath}/${item.path}`;
            const active =
              item.path === "pro"
                ? location.pathname === href || location.pathname === `${href}/`
                : location.pathname.startsWith(href);
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
