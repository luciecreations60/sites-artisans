import type { OfferTier, TradeSlug } from "../../data/types.ts";
import type { ProductionJob, SiteContent } from "./types.ts";

export const TEMPLATE_VERSION = "v4-templates-1";
export const BUILD_CONFIG_VERSION = 1 as const;

/** Format de configuration typé et versionné pour la génération. */
export type SiteBuildConfig = {
  version: typeof BUILD_CONFIG_VERSION;
  templateVersion: string;
  projectId: string;
  jobId: string;
  tradeSlug: TradeSlug;
  planId: OfferTier;
  companyName: string;
  city: string;
  specialty: string;
  themeId: string;
  fontId: string;
  modules: string[];
  content: SiteContent;
  isTestFixture: boolean;
  /** Jamais de clés CRM / Supabase ici. */
  generatedAt: string;
};

const THEME_COLORS: Record<string, { ink: string; paper: string; accent: string; muted: string }> =
  {
    sage: { ink: "#24302c", paper: "#f7f5f1", accent: "#5f8f82", muted: "#5f6f69" },
    mint: { ink: "#1f3330", paper: "#f5f8f6", accent: "#3d9b8a", muted: "#5a706b" },
    ocean: { ink: "#1a2a33", paper: "#f4f7f9", accent: "#3d7ea6", muted: "#5a6f7a" },
    terracotta: { ink: "#2c241f", paper: "#faf6f2", accent: "#c4785a", muted: "#6f625a" },
    slate: { ink: "#1e242b", paper: "#f5f6f8", accent: "#5a6b7d", muted: "#5f6b75" },
  };

const FONT_STACKS: Record<string, { display: string; body: string }> = {
  classic: {
    display: '"Fraunces", Georgia, serif',
    body: '"Source Sans 3", system-ui, sans-serif',
  },
  modern: {
    display: '"DM Sans", system-ui, sans-serif',
    body: '"DM Sans", system-ui, sans-serif',
  },
  editorial: {
    display: '"Libre Baskerville", Georgia, serif',
    body: '"Nunito Sans", system-ui, sans-serif',
  },
};

/** Modules réellement activables sur un site généré (pas le catalogue entier). */
export function resolveBuildModules(
  planId: OfferTier,
  desiredFeatureIds: string[],
): { modules: string[]; skipped: string[] } {
  const implemented = new Set([
    "gallery_basic",
    "gallery_filtered",
    "gallery_before_after",
    "estimator",
    "quote_form",
    "contact_form",
    "service_area",
    "testimonials",
    "services_list",
    "about_company",
  ]);

  const tierDefaults: Record<OfferTier, string[]> = {
    essentiel: ["gallery_basic", "contact_form", "about_company", "services_list", "testimonials", "service_area"],
    avance: [
      "gallery_basic",
      "gallery_filtered",
      "contact_form",
      "quote_form",
      "about_company",
      "services_list",
      "testimonials",
      "service_area",
    ],
    pro: [
      "gallery_basic",
      "gallery_filtered",
      "gallery_before_after",
      "estimator",
      "contact_form",
      "quote_form",
      "about_company",
      "services_list",
      "testimonials",
      "service_area",
    ],
  };

  const wanted = new Set([...tierDefaults[planId], ...desiredFeatureIds]);
  const modules: string[] = [];
  const skipped: string[] = [];
  for (const id of wanted) {
    if (implemented.has(id)) modules.push(id);
    else skipped.push(id);
  }
  return { modules: [...new Set(modules)].sort(), skipped };
}

export function productionJobToBuildConfig(job: ProductionJob): SiteBuildConfig {
  const { modules } = resolveBuildModules(job.planId, job.config.desiredFeatureIds);
  return {
    version: BUILD_CONFIG_VERSION,
    templateVersion: TEMPLATE_VERSION,
    projectId: job.projectId,
    jobId: job.id,
    tradeSlug: job.tradeSlug,
    planId: job.planId,
    companyName: job.config.companyName || job.companyName,
    city: job.config.city,
    specialty: job.config.specialty,
    themeId: job.config.themeId,
    fontId: job.config.fontId,
    modules,
    content: job.content,
    isTestFixture: job.isTestFixture || job.content.isTestFixture,
    generatedAt: new Date().toISOString(),
  };
}

export function themeFor(themeId: string) {
  return THEME_COLORS[themeId] ?? THEME_COLORS.sage;
}

export function fontsFor(fontId: string) {
  return FONT_STACKS[fontId] ?? FONT_STACKS.classic;
}
