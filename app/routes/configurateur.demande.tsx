import { useEffect, useState } from "react";
import { CommercialRequestForm } from "~/components/configurator/CommercialRequestForm";
import type { PublicCatalog } from "~/data/catalog/types";
import { loadPublicCatalog } from "~/lib/catalog/api";

export const meta = () => [{ title: "Demande commerciale — Configurateur" }];

export default function ConfigurateurDemandePage() {
  const [catalog, setCatalog] = useState<PublicCatalog | null>(null);
  const [status, setStatus] = useState<"ready" | "migration_pending" | "error">(
    "migration_pending",
  );

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
          <p>Préparation du formulaire…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: "40rem" }}>
        <CommercialRequestForm catalog={catalog} catalogStatus={status} />
      </div>
    </main>
  );
}
