import { useMemo, useState } from "react";
import { Link } from "react-router";
import type {
  ContentProposal,
  MeetingNote,
  ProductionJob,
  SiteContent,
} from "~/lib/production/types";
import { PRODUCTION_STATUS_LABELS } from "~/lib/production/types";
import {
  buildContentChecklist,
  checklistComplete,
  derivePrepStatus,
} from "~/lib/production/checklist";
import { evaluateProductionEligibility } from "~/lib/production/eligibility";
import {
  applyAcceptedProposal,
  createMeetingNote,
  extractProposalsFromMeetingNote,
} from "~/lib/production/meetingNotes";
import { tierLabels } from "~/data/offers";

type Props = {
  job: ProductionJob;
  onSave: (job: ProductionJob) => void;
};

export function ProductionSheet({ job, onSave }: Props) {
  const [draft, setDraft] = useState(job);
  const [noteTitle, setNoteTitle] = useState("Compte rendu rendez-vous");
  const [noteDate, setNoteDate] = useState(new Date().toISOString().slice(0, 10));
  const [noteBody, setNoteBody] = useState("");
  const [noteInternal, setNoteInternal] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const checklist = useMemo(() => buildContentChecklist(draft), [draft]);
  const elig = evaluateProductionEligibility(draft, {
    quoteAccepted: Boolean(draft.config.acceptedQuoteReference),
  });

  const updateContent = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setDraft((d) => ({ ...d, content: { ...d.content, [key]: value } }));
  };

  const persist = (next: ProductionJob) => {
    const withStatus = { ...next, prepStatus: derivePrepStatus(next) };
    setDraft(withStatus);
    onSave(withStatus);
    setMessage("Fiche enregistrée localement.");
  };

  const onImportNote = () => {
    if (!noteBody.trim()) {
      setMessage("Collez d’abord une transcription ou un compte rendu.");
      return;
    }
    const note = createMeetingNote({
      title: noteTitle,
      meetingDate: noteDate,
      body: noteBody,
      internalNotes: noteInternal,
    });
    const proposals = extractProposalsFromMeetingNote(note, draft.content, {
      companyName: draft.config.companyName,
      city: draft.config.city,
      specialty: draft.config.specialty,
    });
    const next: ProductionJob = {
      ...draft,
      meetingNotes: [note, ...draft.meetingNotes],
      proposals: [...proposals, ...draft.proposals],
    };
    persist(next);
    setNoteBody("");
    setMessage(
      `${proposals.length} proposition(s) extraite(s) — validation manuelle requise (pas d’application automatique).`,
    );
  };

  const decideProposal = (
    proposal: ContentProposal,
    decision: "accepted" | "ignored" | "edited",
    editedValue?: string,
  ) => {
    if (decision === "ignored") {
      const next = {
        ...draft,
        proposals: draft.proposals.map((p) =>
          p.id === proposal.id ? { ...p, status: "ignored" as const } : p,
        ),
      };
      persist(next);
      return;
    }
    if (proposal.requiresCommercialReview) {
      setMessage(
        "Demande hors périmètre devis — avenant commercial requis. Le devis verrouillé n’est pas modifié.",
      );
      const next = {
        ...draft,
        proposals: draft.proposals.map((p) =>
          p.id === proposal.id ? { ...p, status: "ignored" as const } : p,
        ),
      };
      persist(next);
      return;
    }
    if (
      proposal.field === "companyName" ||
      proposal.field === "city" ||
      proposal.field === "specialty"
    ) {
      const value = editedValue ?? proposal.proposedValue;
      const next: ProductionJob = {
        ...draft,
        companyName:
          proposal.field === "companyName" ? value : draft.companyName,
        config: {
          ...draft.config,
          companyName:
            proposal.field === "companyName" ? value : draft.config.companyName,
          city: proposal.field === "city" ? value : draft.config.city,
          specialty:
            proposal.field === "specialty" ? value : draft.config.specialty,
        },
        proposals: draft.proposals.map((p) =>
          p.id === proposal.id
            ? { ...p, status: decision === "edited" ? "edited" : "accepted" }
            : p,
        ),
      };
      persist(next);
      return;
    }
    const applied = applyAcceptedProposal(draft.content, proposal, editedValue);
    if (!applied.applied) {
      setMessage(applied.blockedReason ?? "Non appliqué");
      return;
    }
    const next: ProductionJob = {
      ...draft,
      content: applied.content,
      proposals: draft.proposals.map((p) =>
        p.id === proposal.id
          ? { ...p, status: decision === "edited" ? "edited" : "accepted" }
          : p,
      ),
    };
    persist(next);
  };

  const pending = draft.proposals.filter((p) => p.status === "pending");

  return (
    <div className="prod-sheet">
      <p>
        <Link to="/admin/production">← Production des sites</Link>
        {draft.projectId ? (
          <>
            {" · "}
            <Link to={`/admin/projets/${draft.projectId}`}>Projet CRM</Link>
          </>
        ) : null}
      </p>

      <header style={{ marginBottom: "1.5rem" }}>
        <p className="eyebrow">Fiche de production</p>
        <h1 style={{ margin: "0.25rem 0" }}>{draft.companyName}</h1>
        <p className="text-muted">
          {draft.tradeSlug} · {tierLabels[draft.planId]} ·{" "}
          {PRODUCTION_STATUS_LABELS[draft.prepStatus]}
          {draft.isTestFixture ? " · TEST" : ""}
        </p>
      </header>

      {message ? (
        <p className="banner banner--info" role="status">
          {message}
        </p>
      ) : null}

      <section className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Données automatiques (configuration)</h2>
        <ul className="text-muted" style={{ fontSize: "0.95rem" }}>
          <li>Entreprise : {draft.config.companyName || "—"}</li>
          <li>Ville : {draft.config.city || "—"}</li>
          <li>Spécialité : {draft.config.specialty || "—"}</li>
          <li>Thème / police : {draft.config.themeId} / {draft.config.fontId}</li>
          <li>Modules : {draft.config.desiredFeatureIds.join(", ") || "—"}</li>
          <li>
            Devis accepté : {draft.config.acceptedQuoteReference || "aucun (fixture ou en attente)"}
          </li>
        </ul>
        <p style={{ fontSize: "0.875rem" }}>
          Le snapshot du devis émis n’est jamais écrasé depuis cet atelier.
        </p>
      </section>

      <section className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Checklist contenus</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {checklist.map((item) => (
            <li key={item.id} style={{ marginBottom: "0.35rem" }}>
              <span aria-hidden>{item.ok ? "✓" : "○"}</span> {item.label}
              {item.required && !item.ok ? (
                <span className="text-muted"> — requis</span>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          {checklistComplete(checklist)
            ? "Checklist complète."
            : "Données absentes non remplacées par du contenu présenté comme réel."}
        </p>
      </section>

      <section className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Contenus complémentaires</h2>
        <div className="personalizer__grid">
          {(
            [
              ["activityDescription", "Description de l’activité"],
              ["aboutText", "Présentation"],
              ["servicesDetail", "Prestations détaillées"],
              ["publicPhone", "Téléphone public"],
              ["publicEmail", "E-mail public"],
              ["publicAddress", "Adresse professionnelle"],
              ["hours", "Horaires"],
              ["serviceArea", "Zone d’intervention"],
              ["bookingUrl", "Lien de réservation"],
              ["legalMentions", "Mentions légales"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} style={{ gridColumn: key.length > 12 ? "1 / -1" : undefined }}>
              <label htmlFor={`pc-${key}`}>{label}</label>
              {key === "aboutText" ||
              key === "servicesDetail" ||
              key === "legalMentions" ||
              key === "activityDescription" ? (
                <textarea
                  id={`pc-${key}`}
                  rows={3}
                  value={draft.content[key]}
                  onChange={(e) => updateContent(key, e.target.value)}
                />
              ) : (
                <input
                  id={`pc-${key}`}
                  value={draft.content[key]}
                  onChange={(e) => updateContent(key, e.target.value)}
                />
              )}
            </div>
          ))}
          <div>
            <label htmlFor="pc-photos">Nombre de photos reçues</label>
            <input
              id="pc-photos"
              type="number"
              min={0}
              value={draft.content.photoCount}
              onChange={(e) => updateContent("photoCount", Number(e.target.value) || 0)}
            />
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={draft.content.logoPresent}
                onChange={(e) => updateContent("logoPresent", e.target.checked)}
              />{" "}
              Logo reçu
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={draft.content.imageRightsConfirmed}
                onChange={(e) => updateContent("imageRightsConfirmed", e.target.checked)}
              />{" "}
              Droits d’images confirmés
            </label>
          </div>
        </div>
        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <button type="button" className="btn btn-primary" onClick={() => persist(draft)}>
            Enregistrer la fiche
          </button>
        </div>
      </section>

      <section className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Compte rendu de rendez-vous</h2>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          Collez une transcription (Apple Notes, etc.). Pas d’intégration audio ni d’IA obligatoire —
          extraction assistée par règles, validation manuelle.
        </p>
        <div className="personalizer__grid">
          <div>
            <label htmlFor="mn-title">Titre</label>
            <input
              id="mn-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="mn-date">Date du rendez-vous</label>
            <input
              id="mn-date"
              type="date"
              value={noteDate}
              onChange={(e) => setNoteDate(e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="mn-body">Transcription / compte rendu</label>
            <textarea
              id="mn-body"
              rows={6}
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={"Entreprise : …\nVille : …\nTéléphone : …"}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label htmlFor="mn-int">Notes internes (non partagées au client)</label>
            <textarea
              id="mn-int"
              rows={2}
              value={noteInternal}
              onChange={(e) => setNoteInternal(e.target.value)}
            />
          </div>
        </div>
        <button type="button" className="btn btn-outline" onClick={onImportNote}>
          Importer et proposer des modifications
        </button>

        {pending.length > 0 ? (
          <div style={{ marginTop: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem" }}>Propositions à valider</h3>
            {pending.map((p) => (
              <ProposalRow key={p.id} proposal={p} onDecide={decideProposal} />
            ))}
          </div>
        ) : null}

        {draft.meetingNotes.length > 0 ? (
          <div style={{ marginTop: "1rem" }}>
            <h3 style={{ fontSize: "1rem" }}>Historique</h3>
            <ul>
              {draft.meetingNotes.map((n: MeetingNote) => (
                <li key={n.id}>
                  {n.meetingDate} — {n.title} ({n.status}
                  {n.shareWithClient ? ", partagé client" : ", interne"})
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ marginBottom: "1.25rem", padding: "1.25rem" }}>
        <h2 style={{ fontSize: "1.15rem" }}>Génération & livraison</h2>
        {!elig.ok ? (
          <div>
            <p>
              <strong>Génération livrable indisponible</strong> — pas de faux succès.
            </p>
            <ul>
              {elig.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {draft.isTestFixture ? (
              <p>
                Fixture TEST :{" "}
                <code>npm run generate:site -- --fixture={draft.planId}</code>
              </p>
            ) : null}
          </div>
        ) : elig.mode === "test_fixture" ? (
          <div>
            <p>
              Mode <strong>TEST</strong> — génération locale autorisée pour valider le moteur.
              Ne constitue pas une livraison client.
            </p>
            <pre
              style={{
                background: "var(--surface-muted, #f4f4f4)",
                padding: "0.75rem",
                overflow: "auto",
                fontSize: "0.85rem",
              }}
            >
              {`npm run generate:site -- --fixture=${draft.planId} --out=generated-sites/${draft.id}`}
            </pre>
            <p className="text-muted" style={{ fontSize: "0.875rem" }}>
              Aucun déploiement automatique. Le client possède son hébergement.
            </p>
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "0.75rem" }}
              onClick={() => downloadJobJson(draft)}
            >
              Exporter la fiche JSON (CLI --job-file)
            </button>
          </div>
        ) : (
          <div>
            <p>Éligible à la génération locale après validation humaine.</p>
            <pre
              style={{
                background: "var(--surface-muted, #f4f4f4)",
                padding: "0.75rem",
                overflow: "auto",
                fontSize: "0.85rem",
              }}
            >
              {`npm run generate:site -- --job-file=./${draft.id}.json --out=generated-sites/${draft.id}`}
            </pre>
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "0.75rem" }}
              onClick={() => downloadJobJson(draft)}
            >
              Exporter la fiche JSON (CLI --job-file)
            </button>
          </div>
        )}

        <div className="hero-actions" style={{ marginTop: "1rem" }}>
          <label>
            <input
              type="checkbox"
              checked={draft.validationInternal}
              onChange={(e) => {
                const next = { ...draft, validationInternal: e.target.checked };
                persist(next);
              }}
            />{" "}
            Validation interne
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.validationClient}
              onChange={(e) => {
                const next = { ...draft, validationClient: e.target.checked };
                persist(next);
              }}
            />{" "}
            Accord client
          </label>
        </div>
      </section>
    </div>
  );
}

function downloadJobJson(job: ProductionJob) {
  const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${job.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function ProposalRow({
  proposal,
  onDecide,
}: {
  proposal: ContentProposal;
  onDecide: (
    p: ContentProposal,
    d: "accepted" | "ignored" | "edited",
    edited?: string,
  ) => void;
}) {
  const [edit, setEdit] = useState(proposal.proposedValue);
  return (
    <article
      style={{
        borderTop: "1px solid var(--border, #ddd)",
        padding: "0.75rem 0",
      }}
    >
      <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>
        {String(proposal.field)}
        {proposal.requiresCommercialReview ? " · avenant commercial" : ""}
      </p>
      <p style={{ margin: 0, fontSize: "0.875rem" }}>
        Actuel : {proposal.currentValue || "—"}
      </p>
      <p style={{ margin: "0.25rem 0", fontSize: "0.875rem" }}>
        Proposé ({proposal.sourceLabel}) :{" "}
        <input value={edit} onChange={(e) => setEdit(e.target.value)} style={{ width: "100%" }} />
      </p>
      <div className="hero-actions" style={{ gap: "0.5rem" }}>
        <button
          type="button"
          className="btn btn-primary"
          style={{ fontSize: "0.8125rem" }}
          onClick={() =>
            onDecide(
              proposal,
              edit !== proposal.proposedValue ? "edited" : "accepted",
              edit,
            )
          }
        >
          Accepter
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: "0.8125rem" }}
          onClick={() => onDecide(proposal, "ignored")}
        >
          Ignorer
        </button>
      </div>
    </article>
  );
}
