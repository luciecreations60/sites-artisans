import { Link } from "react-router";
import type { ProductionJob } from "~/lib/production/types";
import { PRODUCTION_STATUS_LABELS } from "~/lib/production/types";
import { buildContentChecklist, checklistComplete } from "~/lib/production/checklist";
import { evaluateProductionEligibility } from "~/lib/production/eligibility";
import { tierLabels } from "~/data/offers";

type Props = {
  jobs: ProductionJob[];
  backendMessage: string;
};

export function ProductionBoard({ jobs, backendMessage }: Props) {
  return (
    <div>
      <p className="text-muted" style={{ marginBottom: "1.25rem" }}>
        {backendMessage}
      </p>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Client / Entreprise</th>
              <th>Métier</th>
              <th>Formule</th>
              <th>Projet</th>
              <th>Préparation</th>
              <th>Contenus</th>
              <th>Génération</th>
              <th>Hébergement</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const items = buildContentChecklist(job);
              const contentOk = checklistComplete(items);
              const elig = evaluateProductionEligibility(job, {
                quoteAccepted: Boolean(job.config.acceptedQuoteReference),
              });
              return (
                <tr key={job.id}>
                  <td>
                    <strong>{job.companyName}</strong>
                    <br />
                    <span className="text-muted">{job.clientName}</span>
                    {job.isTestFixture ? (
                      <>
                        <br />
                        <span className="badge">TEST</span>
                      </>
                    ) : null}
                  </td>
                  <td>{job.tradeSlug}</td>
                  <td>{tierLabels[job.planId]}</td>
                  <td>
                    <code style={{ fontSize: "0.75rem" }}>{job.projectId || "—"}</code>
                    <br />
                    {job.projectTitle}
                  </td>
                  <td>{PRODUCTION_STATUS_LABELS[job.prepStatus]}</td>
                  <td>
                    {contentOk ? "OK" : "Incomplets"}
                    <br />
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      Photos {job.content.photoCount}
                      {job.content.logoPresent ? " · Logo" : ""}
                    </span>
                  </td>
                  <td>
                    {job.lastGenerationAt
                      ? new Date(job.lastGenerationAt).toLocaleDateString("fr-FR")
                      : "—"}
                    <br />
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {elig.ok
                        ? elig.mode === "test_fixture"
                          ? "Test local"
                          : "Éligible"
                        : "Bloqué"}
                    </span>
                  </td>
                  <td>
                    {job.hosting.domain || "Client propriétaire"}
                    <br />
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {job.hosting.provider || "Non renseigné"}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/production/${job.id}`}
                      className="btn btn-ghost"
                      style={{ fontSize: "0.8125rem" }}
                    >
                      Ouvrir la fiche
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {jobs.length === 0 ? (
        <p className="text-muted">Aucun projet en production pour le moment.</p>
      ) : null}
    </div>
  );
}
