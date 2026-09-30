import { Link, Outlet, useLoaderData, useLocation } from "react-router";
import { DemoChrome } from "~/components/DemoChrome";
import { TradeTheme } from "~/components/TradeTheme";
import { requireTrade } from "~/data/trades";
import { companyName } from "~/lib/personalize";
import { useAppliedTrade } from "~/lib/useAppliedTrade";

export function loader({ params }: { params: { trade?: string } }) {
  return { trade: requireTrade(params.trade ?? "") };
}

const nav = [
  { path: "avance", label: "Accueil" },
  { path: "avance/services", label: "Services" },
  { path: "avance/realisations", label: "Réalisations" },
  { path: "avance/devis", label: "Devis" },
  { path: "avance/contact", label: "Contact" },
];

export default function DemoAvanceLayout() {
  const { trade: base } = useLoaderData<typeof loader>();
  const trade = useAppliedTrade(base);
  const location = useLocation();
  const basePath = `/demos/${trade.slug}`;

  return (
    <TradeTheme trade={trade}>
      <DemoChrome tradeLabel={trade.label} tier="avance" />
      <header className="container section--tight">
        <p style={{ margin: 0, fontWeight: 600 }}>{companyName(trade)}</p>
        <p className="text-muted" style={{ margin: "0.25rem 0 0" }}>{trade.defaultCity}</p>
      </header>
      <nav className="container demo-nav" aria-label="Navigation démo">
        {nav.map((item) => {
          const href = `${basePath}/${item.path}`;
          const active = location.pathname === href || location.pathname === `${href}/`;
          return (
            <Link key={item.path} to={href} className={active ? "active" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Outlet context={{ trade }} />
    </TradeTheme>
  );
}
