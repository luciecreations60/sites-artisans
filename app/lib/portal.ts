import type {
  AppRole,
  ChangeRequestStatus,
  OfferTier,
  Profile,
  ProjectStatus,
} from "~/lib/supabase.types";

export function isAdminRole(role: AppRole | null | undefined): boolean {
  return role === "admin";
}

/** Prénom d’affichage : premier mot de full_name, jamais l’e-mail. */
export function displayFirstName(profile: Profile | null | undefined): string | null {
  const raw = profile?.full_name?.trim();
  if (!raw) return null;
  if (raw.includes("@")) return null;
  const first = raw.split(/\s+/)[0];
  return first || null;
}

export function greetTitle(profile: Profile | null | undefined): string {
  const first = displayFirstName(profile);
  return first ? `Bonjour, ${first}` : "Bonjour";
}

export function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const OFFER_TIER_LABELS: Record<OfferTier, string> = {
  essentiel: "Essentiel",
  avance: "Avancé",
  pro: "Pro",
};

export function offerLabel(tier: OfferTier | null | undefined): string {
  if (!tier) return "—";
  return OFFER_TIER_LABELS[tier] ?? tier;
}

export const CHANGE_STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  ouvert: "Ouverte",
  en_cours: "En cours",
  besoin_info: "Besoin d’information",
  termine: "Terminée",
  refuse: "Refusée",
};

export function changeStatusLabel(status: ChangeRequestStatus | string): string {
  return CHANGE_STATUS_LABELS[status as ChangeRequestStatus] ?? status;
}

/** Ordre canonique du workflow projet (statuts existants conservés). */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "brief",
  "design",
  "contenu",
  "recette",
  "en_ligne",
  "maintenance",
];

export function statusIndex(status: ProjectStatus): number {
  const i = PROJECT_STATUS_ORDER.indexOf(status);
  return i < 0 ? 0 : i;
}

export function isOpenChangeStatus(status: ChangeRequestStatus | string): boolean {
  return status === "ouvert" || status === "en_cours" || status === "besoin_info";
}

export function postLoginPath(role: AppRole | null | undefined): string {
  return isAdminRole(role) ? "/admin" : "/espace-client";
}
