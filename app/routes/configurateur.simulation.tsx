import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ConfigurationRecap } from "~/components/configurator/ConfigurationRecap";
import type { PublicCatalog } from "~/data/catalog/types";
import { loadPublicCatalog } from "~/lib/catalog/api";
import { loadConfiguratorState } from "~/lib/configurator/storage";

export const meta = () => [
  { title: "Simulation commerciale — Configurateur" },
];

export default function ConfigurateurSimulationPage() {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [status, setStatus] = useState<"ready" | "migration_pending" | "error">(
    "migration_pending",
  );
  const state = loadConfiguratorState();

  useEffect(() => {
    let active = true;
    void loadPublicCatalog().then((res) => {
      if (!active) return;
      setCatalog(res.catalog);
      setStatus(
        res.status === "ready" ? "ready" : res.status === "error" ? "error" : "migration_pending",
      );
    });
    return () => {
      active = false;
    };
  }, []);

  if (!catalog) {
    return (
      <main className="section">
        <div className="container">
          <p>Chargement de la simulation…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "52rem" }}>
        <p className="cfg-sim-banner" role="note">
          Document de simulation commerciale — non contractuel. Un devis officiel nécessite une
          validation administrative.
        </p>
        <ConfigurationRecap
          state={state}
          catalog={catalog}
          catalogStatus={status}
          onPrint={() => window.print()}
        />
        <p style={{ marginTop: "1.5rem" }}>
          <Link to="/configurateur" className="btn btn-ghost">
            Retour au configurateur
          </Link>
        </p>
      </div>
    </main>
  );
}
