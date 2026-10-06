import { Outlet, useLocation } from "react-router";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";

export default function MarketingLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && <SiteHeader />}
      <div className={`page-main${isAdmin ? " page-main--admin" : ""}`}>
        <Outlet />
      </div>
      {!isAdmin && <SiteFooter />}
    </>
  );
}
