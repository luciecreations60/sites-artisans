import type { OfferTier } from "../../data/types.ts";
import type { ChecklistItem, ProductionJob, SiteContent } from "./types.ts";

function hasText(value: string | undefined | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

/**
 * Checklist dépendant du métier, de la formule et des modules inclus.
 * Absence ≠ contenu inventé : on signale uniquement.
 */
export function buildContentChecklist(
  job: Pick<ProductionJob, "config" | "content" | "planId">,
): ChecklistItem[] {
  const { content, config } = job;
  const planId = job.planId ?? config.planId;
  const features = new Set(config.desiredFeatureIds);
  const items: ChecklistItem[] = [
    {
      id: "company",
      label: "Nom d’entreprise confirmé",
      ok: hasText(config.companyName),
      required: true,
    },
    {
      id: "city",
      label: "Ville / secteur confirmé",
      ok: hasText(config.city),
      required: true,
    },
    {
      id: "logo",
      label: "Logo fourni",
      ok: content.logoPresent,
      required: planId !== "essentiel",
    },
    {
      id: "coords",
      label: "Coordonnées publiques à confirmer",
      ok: hasText(content.publicPhone) || hasText(content.publicEmail),
      required: true,
    },
    {
      id: "photos",
      label: photosLabel(planId, content),
      ok: content.photoCount >= minPhotos(planId),
      required: true,
    },
    {
      id: "about",
      label: "Textes de présentation à valider",
      ok: hasText(content.aboutText) || hasText(content.activityDescription),
      required: true,
    },
    {
      id: "legal",
      label: "Mentions légales nécessaires au site",
      ok: hasText(content.legalMentions),
      required: true,
    },
    {
      id: "image_rights",
      label: "Droits d’utilisation des images confirmés",
      ok: content.imageRightsConfirmed,
      required: true,
    },
    {
      id: "not_demo",
      label: "Aucun contenu de démonstration présenté comme réel",
      ok: !content.isTestFixture,
      required: true,
    },
  ];

  if (features.has("booking_link") || features.has("planity") || features.has("reservation")) {
    items.push({
      id: "booking",
      label: "Adresse de réservation / lien Planity",
      ok: hasText(content.bookingUrl),
      required: true,
      dependsOn: "booking",
    });
  }

  if (planId === "pro" || features.has("estimator")) {
    items.push({
      id: "services",
      label: "Prestations détaillées (estimateur / services)",
      ok: hasText(content.servicesDetail),
      required: true,
    });
  }

  if (planId === "avance" || planId === "pro") {
    items.push({
      id: "hours",
      label: "Horaires",
      ok: hasText(content.hours),
      required: false,
    });
  }

  return items;
}

function minPhotos(planId: OfferTier): number {
  if (planId === "pro") return 5;
  if (planId === "avance") return 3;
  return 3;
}

function photosLabel(planId: OfferTier, content: SiteContent): string {
  const need = minPhotos(planId);
  return `${need} photos nécessaires (reçues : ${content.photoCount})`;
}

export function checklistComplete(items: ChecklistItem[]): boolean {
  return items.filter((i) => i.required).every((i) => i.ok);
}

export function derivePrepStatus(
  job: Pick<ProductionJob, "prepStatus" | "config" | "content" | "planId" | "validationInternal" | "validationClient" | "generations">,
): ProductionJob["prepStatus"] {
  if (job.prepStatus === "delivered") return "delivered";
  if (job.validationClient && job.validationInternal) return "ready_to_deliver";
  if (job.validationInternal && !job.validationClient) return "client_validation";
  const lastOk = job.generations.some((g) => g.result === "success" && !g.superseded);
  if (lastOk) return "to_review";
  const items = buildContentChecklist(job);
  if (!checklistComplete(items)) return "content_incomplete";
  return "ready_to_generate";
}
