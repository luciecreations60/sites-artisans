import { Outlet, useLocation } from "react-router";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";

export default function MarketingLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      <a className="skip-link" href="#contenu-principal">
        Aller au contenu
      </a>
      {!isAdmin && <SiteHeader />}
      <div
        id="contenu-principal"
        className={`page-main${isAdmin ? " page-main--admin" : ""}`}
        tabIndex={-1}
      >
        <Outlet />
      </div>
      {!isAdmin && <SiteFooter />}
    </>
  );
}
