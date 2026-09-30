import { useAuth } from "~/lib/auth";
import {
  ClientDashboard,
  PortalLanding,
  PortalSetupNeeded,
} from "~/components/portal/PortalHome";

export const meta = () => [{ title: "Espace client — Sites Artisans" }];

export default function EspaceClient() {
  const { configured, loading, user } = useAuth();

  if (!configured) return <PortalSetupNeeded />;
  if (loading) {
    return (
      <section className="section">
        <div className="container">
          <p className="text-muted">Chargement de votre session…</p>
        </div>
      </section>
    );
  }
  if (!user) return <PortalLanding />;
  return <ClientDashboard />;
}
