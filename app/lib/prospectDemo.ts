import type { OfferTier } from "~/data/types";
import type { Prospect } from "~/lib/crm.types";
import { emptyProfile, type Profile } from "~/lib/personalize";
import type {
  ProspectDemo,
  ProspectDemoStatus,
  ProspectDemoStatusCode,
  PublicProspectDemo,
} from "~/lib/prospectDemo.types";
import { PUBLIC_DEMO_STATUS_CODES } from "~/lib/prospectDemo.types";

const OFFER_TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

/** Profil démo prospect (étend le Profile localStorage avec tagline / intro). */
export type ProspectDemoProfile = Profile & {
  tagline: string;
  intro: string;
};

function randomSuffix(bytes = 4): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

function slugifyBase(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "demo";
}

/** Slug public stable : base-entreprise + suffixe crypto. */
export function generatePublicSlug(companyName: string): string {
  return `${slugifyBase(companyName)}-${randomSuffix(4)}`;
}

export function normalizeOfferTiers(tiers: string[] | null | undefined): OfferTier[] {
  const filtered = (tiers ?? []).filter((t): t is OfferTier =>
    OFFER_TIERS.includes(t as OfferTier),
  );
  return filtered.length ? filtered : [...OFFER_TIERS];
}

/**
 * UX helper — la sécurité réelle est dans PostgreSQL
 * (`is_prospect_demo_publicly_accessible` / RPC).
 */
export function isProspectDemoPubliclyAccessible(
  demo: Pick<ProspectDemo, "published_at" | "disabled_at" | "expires_at" | "status_id">,
  status: Pick<ProspectDemoStatus, "code"> | undefined,
  now = new Date(),
): boolean {
  if (!status || !PUBLIC_DEMO_STATUS_CODES.includes(status.code as ProspectDemoStatusCode)) {
    return false;
  }
  if (!demo.published_at) return false;
  if (demo.disabled_at) return false;
  if (demo.expires_at && new Date(demo.expires_at) <= now) return false;
  return true;
}

export function demoDisplayCompany(
  demo: Pick<ProspectDemo | PublicProspectDemo, "company_name" | "commercial_name">,
): string {
  const commercial = demo.commercial_name?.trim();
  return commercial || demo.company_name;
}

export function prospectDemoToProfile(
  demo: Pick<
    ProspectDemo | PublicProspectDemo,
    | "company_name"
    | "commercial_name"
    | "contact_first_name"
    | "contact_last_name"
    | "city"
    | "phone"
    | "email"
    | "specialty"
    | "custom_tagline"
    | "custom_intro"
    | "theme_id"
    | "font_id"
  >,
): ProspectDemoProfile {
  const base = emptyProfile();
  return {
    ...base,
    firstName: demo.contact_first_name?.trim() || base.firstName,
    lastName: demo.contact_last_name?.trim() || base.lastName,
    company: demoDisplayCompany(demo),
    city: demo.city?.trim() || base.city,
    phone: demo.phone?.trim() || base.phone,
    email: demo.email?.trim() || base.email,
    specialty: demo.specialty?.trim() || base.specialty,
    themeId: demo.theme_id || base.themeId,
    fontId: demo.font_id || base.fontId,
    tagline: demo.custom_tagline?.trim() || "",
    intro: demo.custom_intro?.trim() || "",
  };
}

export function snapshotFromProspect(prospect: Prospect): {
  company_name: string;
  commercial_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  specialty: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_area: string | null;
  trade_slug: string;
} {
  return {
    company_name: prospect.company_name,
    commercial_name: prospect.commercial_name,
    contact_first_name: prospect.contact_first_name,
    contact_last_name: prospect.contact_last_name,
    specialty: prospect.specialty,
    city: prospect.city,
    phone: prospect.phone,
    email: prospect.email,
    address: prospect.address,
    service_area: prospect.service_area,
    trade_slug: prospect.trade_slug || "plombier",
  };
}

export function publicDemoPath(slug: string, tier?: OfferTier, rest = ""): string {
  const base = `/demo/${slug}`;
  if (!tier) return base;
  if (tier === "essentiel") return `${base}/essentiel`;
  const suffix = rest.startsWith("/") ? rest : rest ? `/${rest}` : "";
  return `${base}/${tier}${suffix}`;
}

export function isProspectDemoPath(pathname: string): boolean {
  return pathname === "/demo" || pathname.startsWith("/demo/");
}

export function extractProspectDemoSlug(pathname: string): string | null {
  const m = pathname.match(/^\/demo\/([^/]+)/);
  return m?.[1] ?? null;
}
