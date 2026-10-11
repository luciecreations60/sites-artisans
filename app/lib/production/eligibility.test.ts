import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertHonestGenerationResult,
  evaluateProductionEligibility,
} from "./eligibility.ts";
import {
  createIncompleteLiveJob,
  createTestProductionJob,
} from "./fixtures.ts";
import { buildContentChecklist, checklistComplete } from "./checklist.ts";
import {
  applyAcceptedProposal,
  createMeetingNote,
  extractProposalsFromMeetingNote,
} from "./meetingNotes.ts";

describe("éligibilité production", () => {
  it("autorise une fixture TEST sans devis réel", () => {
    const job = createTestProductionJob();
    const res = evaluateProductionEligibility(job, { quoteAccepted: false });
    assert.equal(res.ok, true);
    if (res.ok) assert.equal(res.mode, "test_fixture");
  });

  it("refuse la production si projet manquant", () => {
    const job = createIncompleteLiveJob();
    const res = evaluateProductionEligibility(job, { quoteAccepted: true });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.ok(res.reasons.some((r) => /projet/i.test(r)));
    }
  });

  it("refuse si devis non accepté (hors fixture)", () => {
    const job = createTestProductionJob({
      isTestFixture: false,
      backendAvailable: true,
    });
    job.content.isTestFixture = false;
    job.config.acceptedQuoteReference = "D-20261012-000001";
    const res = evaluateProductionEligibility(job, { quoteAccepted: false });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.ok(res.reasons.some((r) => /devis/i.test(r)));
    }
  });

  it("refuse une simulation comme commande", () => {
    const job = createTestProductionJob({
      isTestFixture: false,
      backendAvailable: true,
    });
    job.content.isTestFixture = false;
    job.config.acceptedQuoteReference = "D-20261012-000001";
    const res = evaluateProductionEligibility(job, {
      quoteAccepted: true,
      quoteKind: "simulation",
    });
    assert.equal(res.ok, false);
  });
});

describe("checklist contenus", () => {
  it("détecte les données manquantes", () => {
    const job = createTestProductionJob();
    job.content.logoPresent = false;
    job.content.photoCount = 0;
    job.content.legalMentions = "";
    job.planId = "avance";
    job.config.planId = "avance";
    const items = buildContentChecklist(job);
    assert.equal(checklistComplete(items), false);
    assert.ok(items.some((i) => i.id === "photos" && !i.ok));
    assert.ok(items.some((i) => i.id === "legal" && !i.ok));
  });

  it("signale le lien de réservation si module présent", () => {
    const job = createTestProductionJob();
    job.config.desiredFeatureIds = [...job.config.desiredFeatureIds, "booking_link"];
    job.content.bookingUrl = "";
    const items = buildContentChecklist(job);
    assert.ok(items.some((i) => i.id === "booking" && !i.ok));
  });
});

describe("compte rendu de rendez-vous", () => {
  it("extrait des propositions structurées sans IA fictive", () => {
    const note = createMeetingNote({
      title: "RDV Senlis",
      meetingDate: "2026-10-10",
      body: [
        "Entreprise : Dupont Plomberie Plus",
        "Ville : Crépy-en-Valois",
        "Téléphone : 06 12 34 56 78",
        "Option : estimateur en ligne",
        "Question : logo vectoriel disponible ?",
      ].join("\n"),
    });
    const job = createTestProductionJob();
    const proposals = extractProposalsFromMeetingNote(note, job.content, {
      companyName: job.companyName,
      city: job.config.city,
      specialty: job.config.specialty,
    });
    assert.ok(proposals.some((p) => p.field === "companyName"));
    assert.ok(proposals.some((p) => p.field === "publicPhone"));
    assert.ok(proposals.some((p) => p.requiresCommercialReview));
    assert.ok(proposals.some((p) => /question/i.test(p.sourceLabel)));
  });

  it("exige une validation explicite — pas d’application auto des options payantes", () => {
    const proposal = {
      id: "p1",
      field: "featureRequest" as const,
      currentValue: "",
      proposedValue: "Estimateur",
      source: "meeting_note" as const,
      sourceLabel: "RDV",
      requiresCommercialReview: true,
      status: "pending" as const,
    };
    const job = createTestProductionJob();
    const res = applyAcceptedProposal(job.content, proposal);
    assert.equal(res.applied, false);
    assert.ok(res.blockedReason?.includes("avenant"));
  });

  it("applique un champ contenu seulement après acceptation", () => {
    const job = createTestProductionJob();
    const proposal = {
      id: "p2",
      field: "publicPhone" as const,
      currentValue: job.content.publicPhone,
      proposedValue: "06 99 99 99 99",
      source: "meeting_note" as const,
      sourceLabel: "RDV",
      requiresCommercialReview: false,
      status: "accepted" as const,
    };
    const res = applyAcceptedProposal(job.content, proposal);
    assert.equal(res.applied, true);
    assert.equal(res.content.publicPhone, "06 99 99 99 99");
  });
});

describe("honnêteté génération", () => {
  it("refuse un faux succès sans dossier", () => {
    const res = assertHonestGenerationResult({
      attempted: true,
      outputExists: false,
      errorMessage: null,
    });
    assert.equal(res.success, false);
  });
});
