import type { ContentProposal, MeetingNote, SiteContent } from "./types.ts";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Crée une note de rendez-vous (brouillon). Pas d’upload audio. */
export function createMeetingNote(input: {
  title: string;
  meetingDate: string;
  body: string;
  internalNotes?: string;
}): MeetingNote {
  const now = new Date().toISOString();
  return {
    id: uid("mn"),
    title: input.title.trim() || "Compte rendu",
    meetingDate: input.meetingDate || now.slice(0, 10),
    body: input.body,
    internalNotes: input.internalNotes ?? "",
    status: "draft",
    shareWithClient: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Extraction assistée par règles (pas d’IA fictive).
 * Détecte des lignes « Clé : valeur » et quelques motifs FR courants.
 */
export function extractProposalsFromMeetingNote(
  note: MeetingNote,
  content: SiteContent,
  current: { companyName: string; city: string; specialty: string },
): ContentProposal[] {
  const proposals: ContentProposal[] = [];
  const lines = note.body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sourceLabel = note.title || "Compte rendu";

  const fieldMap: Record<string, keyof SiteContent | "companyName" | "city" | "specialty"> = {
    entreprise: "companyName",
    "nom d'entreprise": "companyName",
    "raison sociale": "companyName",
    ville: "city",
    secteur: "city",
    spécialité: "specialty",
    specialite: "specialty",
    téléphone: "publicPhone",
    telephone: "publicPhone",
    email: "publicEmail",
    "e-mail": "publicEmail",
    adresse: "publicAddress",
    horaires: "hours",
    zone: "serviceArea",
    "zone d'intervention": "serviceArea",
    présentation: "aboutText",
    presentation: "aboutText",
    "à propos": "aboutText",
    prestations: "servicesDetail",
    réservation: "bookingUrl",
    reservation: "bookingUrl",
    planity: "bookingUrl",
    mentions: "legalMentions",
    "mentions légales": "legalMentions",
  };

  for (const line of lines) {
    const m = line.match(/^([^:]{2,40})\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const key = m[1].trim().toLowerCase();
    const value = m[2].trim();
    if (!value) continue;

    const paidFeature = /option|module|estimateur|avant.?apr[eè]s|page suppl/i.test(key + value);
    if (paidFeature) {
      proposals.push({
        id: uid("prop"),
        field: "featureRequest",
        currentValue: "",
        proposedValue: value,
        source: "meeting_note",
        sourceLabel,
        requiresCommercialReview: true,
        status: "pending",
      });
      continue;
    }

    const field = fieldMap[key];
    if (!field) continue;

    let currentValue = "";
    if (field === "companyName") currentValue = current.companyName;
    else if (field === "city") currentValue = current.city;
    else if (field === "specialty") currentValue = current.specialty;
    else currentValue = String(content[field] ?? "");

    if (currentValue.trim() === value) continue;

    proposals.push({
      id: uid("prop"),
      field,
      currentValue,
      proposedValue: value,
      source: "meeting_note",
      sourceLabel,
      requiresCommercialReview: false,
      status: "pending",
    });
  }

  // Questions non résolues
  for (const line of lines) {
    if (/^(\?|question|à confirmer|a confirmer)/i.test(line)) {
      proposals.push({
        id: uid("prop"),
        field: "featureRequest",
        currentValue: "",
        proposedValue: line.replace(/^question\s*[:：]?\s*/i, ""),
        source: "meeting_note",
        sourceLabel: `${sourceLabel} — question`,
        requiresCommercialReview: false,
        status: "pending",
      });
    }
  }

  return proposals;
}

export function applyAcceptedProposal(
  content: SiteContent,
  proposal: ContentProposal,
  editedValue?: string,
): { content: SiteContent; applied: boolean; blockedReason?: string } {
  if (proposal.requiresCommercialReview) {
    return {
      content,
      applied: false,
      blockedReason:
        "Modification hors périmètre contractuel — validation commerciale / avenant requis. Le devis verrouillé n’est pas modifié.",
    };
  }
  if (proposal.field === "featureRequest" || proposal.field === "companyName" || proposal.field === "city" || proposal.field === "specialty") {
    // company/city/specialty vivent sur config — appelant gère séparément
    return { content, applied: false, blockedReason: "Champ hors SiteContent — appliquer via config" };
  }
  const value = (editedValue ?? proposal.proposedValue).trim();
  return {
    content: { ...content, [proposal.field]: value },
    applied: true,
  };
}
