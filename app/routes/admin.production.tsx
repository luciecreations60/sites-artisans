import { useEffect, useState } from "react";
import { ProductionBoard } from "~/components/production/ProductionBoard";
import { loadProductionJobs } from "~/lib/production/localStore";
import type { ProductionJob } from "~/lib/production/types";
import { getSupabase } from "~/lib/supabase";

export const meta = () => [{ title: "Production des sites — Administration" }];

export default function AdminProduction() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [backendMessage, setBackendMessage] = useState(
    "Vérification du backend commercial…",
  );

  useEffect(() => {
    setJobs(loadProductionJobs());
    const sb = getSupabase();
    if (!sb) {
      setBackendMessage(
        "Supabase non configuré — atelier en mode fixtures locales TEST. Aucune fausse réussite de livraison.",
      );
      return;
    }
    void (async () => {
      const { error } = await sb.from("site_configurations").select("id").limit(1);
      if (error) {
        setBackendMessage(
          "Tables commerciales lot 5 absentes ou inaccessibles — génération livrable désactivée. Fixtures TEST disponibles pour le moteur local.",
        );
      } else {
        setBackendMessage(
          "Backend commercial détecté. Les projets réels apparaîtront ici lorsqu’un devis accepté sera lié ; en attendant, les fixtures TEST restent listées.",
        );
      }
    })();
  }, []);

  return (
    <section className="section section--tight">
      <div className="container">
        <p className="eyebrow">Atelier</p>
        <h1>Production des sites</h1>
        <p className="lead">
          Préparez les sites clients à partir des configurations validées — sans second CRM ni
          ressaisie des données commerciales.
        </p>
        <ProductionBoard jobs={jobs} backendMessage={backendMessage} />
      </div>
    </section>
  );
}
