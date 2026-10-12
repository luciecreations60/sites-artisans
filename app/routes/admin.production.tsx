import { useEffect, useState } from "react";
import { ProductionBoard } from "~/components/production/ProductionBoard";
import { loadCrmProductionJobs } from "~/lib/production/crmLoader";
import {
  createTestAvanceJob,
  createTestProJob,
  createTestProductionJob,
} from "~/lib/production/fixtures";
import {
  getProductionJob,
  loadProductionJobs,
  upsertProductionJob,
} from "~/lib/production/localStore";
import type { ProductionJob } from "~/lib/production/types";
import { getSupabase } from "~/lib/supabase";

export const meta = () => [{ title: "Production des sites — Administration" }];

function testFixtures(): ProductionJob[] {
  return [createTestProductionJob(), createTestAvanceJob(), createTestProJob()];
}

export default function AdminProduction() {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [backendMessage, setBackendMessage] = useState(
    "Chargement de l’atelier de production…",
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const localExtras = loadProductionJobs().filter(
        (j) => !j.isTestFixture && j.id.startsWith("crm_") === false,
      );
      const fixtures = testFixtures();
      const sb = getSupabase();
      const crm = await loadCrmProductionJobs(sb as Parameters<typeof loadCrmProductionJobs>[0]);

      if (!active) return;

      // Fusion : jobs CRM (avec contenus locaux éventuels) + fixtures TEST + brouillons locaux
      const mergedCrm = crm.jobs.map((job) => {
        const saved = getProductionJob(job.id);
        if (!saved) return job;
        return {
          ...job,
          content: saved.content,
          meetingNotes: saved.meetingNotes,
          proposals: saved.proposals,
          generations: saved.generations,
          validationInternal: saved.validationInternal,
          validationClient: saved.validationClient,
          hosting: saved.hosting.domain ? saved.hosting : job.hosting,
          prepStatus: saved.prepStatus,
          lastGenerationAt: saved.lastGenerationAt,
        };
      });

      // Persiste les jobs CRM pour la fiche détail
      for (const job of mergedCrm) {
        upsertProductionJob(job);
      }

      const all = [...mergedCrm, ...fixtures, ...localExtras];
      // dédoublonnage par id
      const byId = new Map<string, ProductionJob>();
      for (const j of all) byId.set(j.id, j);
      setJobs([...byId.values()]);

      if (crm.status === "unavailable") {
        setBackendMessage(crm.message);
      } else if (crm.status === "migration_pending") {
        setBackendMessage(crm.message);
      } else if (crm.status === "error") {
        setBackendMessage(`Erreur CRM : ${crm.message}. Fixtures TEST affichées.`);
      } else if (mergedCrm.length === 0) {
        setBackendMessage(
          "Backend commercial détecté — aucun projet lié pour l’instant. Fixtures TEST disponibles pour le moteur local.",
        );
      } else {
        setBackendMessage(
          `${mergedCrm.length} projet(s) CRM + fixtures TEST. Production livrable uniquement si devis accepté.`,
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="section section--tight">
      <div className="container">
        <p className="eyebrow">Atelier</p>
        <h1>Production des sites</h1>
        <p className="lead">
          Projets CRM et fixtures TEST — sans second dossier client. Les devis émis restent
          immuables.
        </p>
        <ProductionBoard jobs={jobs} backendMessage={backendMessage} />
      </div>
    </section>
  );
}
