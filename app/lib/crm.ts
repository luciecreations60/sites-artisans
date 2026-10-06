import type { Prospect } from "~/lib/crm.types";

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D+/g, "");
}

export function normalizeDomain(url: string | null | undefined): string {
  if (!url) return "";
  let u = url.trim().toLowerCase();
  u = u.replace(/^https?:\/\//, "").replace(/^www\./, "");
  return u.split("/")[0] ?? "";
}

export function normalizeCompany(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

export type DuplicateMatch = {
  prospect: Prospect;
  reasons: string[];
};

export function findDuplicateProspects(
  candidate: Partial<Prospect>,
  existing: Prospect[],
  excludeId?: string,
): DuplicateMatch[] {
  const domain = normalizeDomain(candidate.website_url);
  const email = normalizeEmail(candidate.email);
  const phone = normalizePhone(candidate.phone);
  const company = normalizeCompany(candidate.company_name);
  const city = (candidate.city ?? "").trim().toLowerCase();
  const postal = (candidate.postal_code ?? "").trim();

  const matches: DuplicateMatch[] = [];

  for (const p of existing) {
    if (excludeId && p.id === excludeId) continue;
    const reasons: string[] = [];
    if (domain && normalizeDomain(p.website_url) === domain) reasons.push("même site internet");
    if (email && normalizeEmail(p.email) === email) reasons.push("même e-mail");
    if (phone && phone.length >= 8 && normalizePhone(p.phone) === phone) {
      reasons.push("même téléphone");
    }
    if (
      company &&
      normalizeCompany(p.company_name) === company &&
      postal &&
      (p.postal_code ?? "").trim() === postal
    ) {
      reasons.push("même entreprise + code postal");
    }
    if (
      company &&
      normalizeCompany(p.company_name) === company &&
      city &&
      (p.city ?? "").trim().toLowerCase() === city
    ) {
      reasons.push("même entreprise + ville");
    }
    if (reasons.length) matches.push({ prospect: p, reasons });
  }

  return matches;
}

export function startOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function slugifyCode(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export const CRM_VIEW_KEY = "sa-crm-prospects-view";
