import { Outlet } from "react-router";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";

export default function MarketingLayout() {
  return (
    <>
      <SiteHeader />
      <div className="page-main">
        <Outlet />
      </div>
      <SiteFooter />
    </>
  );
}
