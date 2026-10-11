import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ProductionSheet } from "~/components/production/ProductionSheet";
import { getProductionJob, upsertProductionJob } from "~/lib/production/localStore";
import type { ProductionJob } from "~/lib/production/types";

export const meta = () => [{ title: "Fiche production — Administration" }];

export default function AdminProductionJob() {
  const { jobId } = useParams();
  const [job, setJob] = useState<ProductionJob | null>(null);

  useEffect(() => {
    if (!jobId) return;
    setJob(getProductionJob(jobId));
  }, [jobId]);

  if (!jobId) {
    return (
      <section className="section">
        <div className="container">
          <p>Identifiant manquant.</p>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="section">
        <div className="container">
          <p>Fiche introuvable.</p>
          <Link to="/admin/production">Retour à la production</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section section--tight">
      <div className="container">
        <ProductionSheet
          job={job}
          onSave={(next) => {
            upsertProductionJob(next);
            setJob(next);
          }}
        />
      </div>
    </section>
  );
}
