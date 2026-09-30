import type { TradeData } from "~/data/types";
import { getFontPreset, getThemePreset } from "~/data/stylePresets";

export const PROFILE_KEY = "sa-profile";
export const PROFILE_UPDATED_EVENT = "sa-profile-updated";

export type Profile = {
  firstName: string;
  lastName: string;
  company: string;
  city: string;
  phone: string;
  email: string;
  specialty: string;
  themeId: string;
  fontId: string;
};

export const emptyProfile = (): Profile => ({
  firstName: "",
  lastName: "",
  company: "",
  city: "",
  phone: "",
  email: "",
  specialty: "",
  themeId: "sage",
  fontId: "classic",
});

export function loadProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    return { ...emptyProfile(), ...parsed };
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

function pick(value: string | undefined, fallback: string): string {
  const v = value?.trim();
  return v ? v : fallback;
}

export function applyProfile(trade: TradeData, profile: Profile | null): TradeData {
  if (!profile) return trade;
  const theme = getThemePreset(profile.themeId);
  return {
    ...trade,
    defaultFirstName: pick(profile.firstName, trade.defaultFirstName),
    defaultLastName: pick(profile.lastName, trade.defaultLastName),
    defaultCompany: pick(profile.company, trade.defaultCompany),
    defaultCity: pick(profile.city, trade.defaultCity),
    defaultPhone: pick(profile.phone, trade.defaultPhone),
    defaultEmail: pick(profile.email, trade.defaultEmail),
    specialty: pick(profile.specialty, trade.specialty),
    palette: theme
      ? {
          ink: theme.ink,
          paper: theme.paper,
          muted: theme.muted,
          accent: theme.accent,
          accentSoft: theme.accentSoft,
          surface: theme.surface,
        }
      : trade.palette,
    projects: trade.projects.map((p) => ({
      ...p,
      location: pick(profile.city, p.location),
    })),
  };
}

export function profileFontFamily(profile: Profile | null): { display?: string; body?: string } {
  const font = getFontPreset(profile?.fontId);
  if (!font) return {};
  return { display: font.display, body: font.body };
}

export function artisanName(trade: TradeData): string {
  return `${trade.defaultFirstName} ${trade.defaultLastName}`.trim();
}

export function companyName(trade: TradeData): string {
  return trade.defaultCompany;
}
