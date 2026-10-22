/**
 * Raccord CRM → atelier production.
 * Mapping pur testable sans Supabase ; loader async honnête si tables absentes.
 */
import type { OfferTier, TradeSlug } from "../../data/types.ts";
import type { QuoteRow, SiteConfigurationRow } from "../commercial/types.ts";
import { emptySiteContent } from "./fixtures.ts";
import type { ProductionJob, ProductionPrepStatus } from "./types.ts";

export type CrmProjectRow = {
  id: string;
  title: string;
  trade_slug: string | null;
  offer_tier: string | null;
  status: string;
  client_id: string | null;
  domain: string | null;
};

export type CrmClientRow = {
  id: string;
  full_name?: string | null;
  company_name?: string | null;
  email?: string | null;
};

const TIERS: OfferTier[] = ["essentiel", "avance", "pro"];

function asTier(value: string | null | undefined): OfferTier | null {
  return value && (TIERS as string[]).includes(value) ? (value as OfferTier) : null;
}

function asTrade(value: string | null | undefined): TradeSlug | null {
  return value && value.length > 0 ? (value as TradeSlug) : null;
}

/**
 * Construit un job de production depuis CRM.
 * Bloqué (éligibilité) si devis non accepté — le job peut quand même être listé « à préparer ».
 */
export function mapCrmToProductionJob(input: {
  project: CrmProjectRow;
  client?: CrmClientRow | null;
  configuration?: SiteConfigurationRow | null;
  acceptedQuote?: QuoteRow | null;
  existingContent?: ProductionJob["content"];
}): ProductionJob {
  const { project, client, configuration, acceptedQuote } = input;
  const planId =
    asTier(configuration?.plan_id) ??
    asTier(acceptedQuote?.plan_id) ??
    asTier(project.offer_tier) ??
    "essentiel";
  const tradeSlug =
    asTrade(configuration?.trade_slug) ??
    asTrade(acceptedQuote?.trade_slug) ??
    asTrade(project.trade_slug) ??
    "plombier";

  const companyName =
    configuration?.company_name?.trim() ||
    client?.company_name?.trim() ||
    project.title ||
    "Entreprise";

  const quoteAccepted =
    acceptedQuote?.kind === "issued" &&
    acceptedQuote.status === "accepted" &&
    acceptedQuote.locked === true;

  const prepStatus: ProductionPrepStatus = "to_prepare";

  const profile = (configuration?.profile_snapshot ?? {}) as Record<string, unknown>;

  return {
    id: `crm_${project.id}`,
    projectId: project.id,
    projectTitle: project.title,
    clientName: client?.full_name?.trim() || client?.email || "Client",
    companyName,
    tradeSlug,
    planId,
    configurationId: configuration?.id ?? null,
    prepStatus,
    config: {
      formatVersion: 1,
      configurationId: configuration?.id ?? null,
      tradeSlug,
      planId,
      companyName,
      city: configuration?.city ?? String(profile.city ?? ""),
      specialty: configuration?.specialty ?? String(profile.specialty ?? ""),
      themeId: configuration?.theme_id ?? String(profile.themeId ?? "sage"),
      fontId: configuration?.font_id ?? String(profile.fontId ?? "classic"),
      desiredFeatureIds: configuration?.desired_feature_ids ?? [],
      featureQuantities: configuration?.feature_quantities ?? {},
      profileSnapshot: profile,
      acceptedQuoteReference: quoteAccepted ? acceptedQuote?.reference ?? null : null,
      acceptedQuoteId: quoteAccepted ? acceptedQuote?.id ?? null : null,
    },
    content: input.existingContent ?? emptySiteContent(false),
    meetingNotes: [],
    proposals: [],
    generations: [],
    hosting: {
      provider: "",
      domain: project.domain ?? "",
      notes: "Le client possède et paie son hébergement.",
      clientOwnsHosting: true,
    },
    lastGenerationAt: null,
    validationInternal: false,
    validationClient: false,
    backendAvailable: true,
    isTestFixture: false,
  };
}

/** Règles de blocage production réelle (hors fixtures TEST). */
export function crmProductionBlockers(job: ProductionJob): string[] {
  if (job.isTestFixture) return [];
  const reasons: string[] = [];
  if (!job.projectId?.trim()) reasons.push("Projet absent");
  if (!job.configurationId?.trim()) reasons.push("Configuration absente");
  if (!job.config.acceptedQuoteId || !job.config.acceptedQuoteReference) {
    reasons.push(
      "Devis accepté requis (kind=issued, status=accepted, locked=true — données serveur)",
    );
  }
  if (!job.config.companyName?.trim()) reasons.push("Nom d’entreprise manquant");
  if (!job.config.tradeSlug || !job.config.planId) {
    reasons.push("Métier ou formule manquant");
  }
  return reasons;
}

export type CrmLoadResult =
  | { status: "ready"; jobs: ProductionJob[] }
  | { status: "migration_pending"; message: string; jobs: ProductionJob[] }
  | { status: "error"; message: string; jobs: ProductionJob[] }
  | { status: "unavailable"; message: string; jobs: ProductionJob[] };

/**
 * Charge projets + configs + devis acceptés depuis Supabase.
 * En cas d’échec : jobs vides (les fixtures TEST restent gérées par l’appelant).
 */
type QueryResult<T> = { data: T | null; error: { message?: string } | null };

/** Interface souple — le client Supabase réel est passé tel quel. */
export type ProductionSupabase = {
  from: (table: string) => {
    select: (columns?: string) => Record<string, unknown>;
  };
};

export async function loadCrmProductionJobs(
  sb: ProductionSupabase | null,
): Promise<CrmLoadResult> {
  if (!sb) {
    return {
      status: "unavailable",
      message: "Supabase non configuré — mode fixtures TEST uniquement.",
      jobs: [],
    };
  }

  // Chaînage PostgREST dynamique (typage strict trop fragile hors génériques Supabase)
  const db = sb as unknown as {
    from: (t: string) => {
      select: (c?: string) => {
        order: (col: string, o?: { ascending: boolean }) => Promise<QueryResult<CrmProjectRow[]>>;
        in: (col: string, v: string[]) => Promise<QueryResult<SiteConfigurationRow[]>>;
        eq: (col: string, v: string) => {
          eq: (col: string, v: string) => {
            in: (col: string, v: string[]) => Promise<QueryResult<QuoteRow[]>>;
          };
        };
      };
    };
  };

  try {
    const projectsRes = await db
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (projectsRes.error) {
      const msg = String(projectsRes.error.message ?? projectsRes.error);
      if (/does not exist|relation|42P01/i.test(msg)) {
        return {
          status: "migration_pending",
          message: "Tables projets / commerciales absentes — migration lot 5 requise.",
          jobs: [],
        };
      }
      return { status: "error", message: msg, jobs: [] };
    }

    const projects = projectsRes.data ?? [];
    if (!projects.length) {
      return {
        status: "ready",
        jobs: [],
      };
    }

    const projectIds = projects.map((p) => p.id);
    const clientIds = [
      ...new Set(projects.map((p) => p.client_id).filter((id): id is string => Boolean(id))),
    ];

    const configsQ = db.from("site_configurations").select("*") as unknown as {
      in: (c: string, v: string[]) => Promise<QueryResult<SiteConfigurationRow[]>>;
    };
    /** Devis acceptés — filtre kind/status/locked puis in(col). */
    type QuotesFiltered = {
      in: (c: string, v: string[]) => Promise<QueryResult<QuoteRow[]>>;
    };
    const quotesAcceptedBase = () =>
      (
        db.from("quotes").select("*") as unknown as {
          eq: (c: string, v: string | boolean) => {
            eq: (c: string, v: string | boolean) => {
              eq: (c: string, v: string | boolean) => QuotesFiltered;
            };
          };
        }
      )
        .eq("kind", "issued")
        .eq("status", "accepted")
        .eq("locked", true);

    const profilesQ = db.from("profiles").select("id, full_name, company_name, email") as unknown as {
      in: (c: string, v: string[]) => Promise<QueryResult<CrmClientRow[]>>;
    };

    const configsRes = await configsQ.in("project_id", projectIds);
    if (configsRes.error) {
      const msg = String(configsRes.error.message ?? configsRes.error);
      if (/does not exist|relation|42P01/i.test(msg)) {
        return {
          status: "migration_pending",
          message:
            "Migration commerciale lot 5 non appliquée — production CRM désactivée (fixtures TEST disponibles).",
          jobs: [],
        };
      }
      return { status: "error", message: msg, jobs: [] };
    }

    const configs = configsRes.data ?? [];
    const configurationIds = configs.map((c) => c.id).filter(Boolean);

    // Devis émis+acceptés : via project_id OU configuration_id
    // (project_id figé après verrouillage — souvent null si émission avant conversion).
    const [quotesByProjectRes, quotesByConfigRes, profilesRes] = await Promise.all([
      quotesAcceptedBase().in("project_id", projectIds),
      configurationIds.length
        ? quotesAcceptedBase().in("configuration_id", configurationIds)
        : Promise.resolve({ data: [] as QuoteRow[], error: null }),
      clientIds.length
        ? profilesQ.in("id", clientIds)
        : Promise.resolve({ data: [] as CrmClientRow[], error: null }),
    ]);

    if (quotesByProjectRes.error || quotesByConfigRes.error) {
      const err = quotesByProjectRes.error || quotesByConfigRes.error;
      const msg = String(err?.message ?? err);
      if (/does not exist|relation|42P01/i.test(msg)) {
        return {
          status: "migration_pending",
          message:
            "Migration commerciale lot 5 non appliquée — production CRM désactivée (fixtures TEST disponibles).",
          jobs: [],
        };
      }
      return { status: "error", message: msg, jobs: [] };
    }

    const quoteMap = new Map<string, QuoteRow>();
    for (const q of [...(quotesByProjectRes.data ?? []), ...(quotesByConfigRes.data ?? [])]) {
      quoteMap.set(q.id, q);
    }
    const quotes = [...quoteMap.values()];
    const profiles = profilesRes.data ?? [];
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const jobs = projects.map((project) => {
      const configuration =
        configs.find((c) => c.project_id === project.id) ??
        null;
      const acceptedQuote =
        quotes.find((q) => q.project_id === project.id) ??
        (configuration
          ? quotes.find((q) => q.configuration_id === configuration.id)
          : null) ??
        null;
      const client = project.client_id
        ? profileMap.get(project.client_id) ?? null
        : null;
      return mapCrmToProductionJob({
        project,
        client,
        configuration,
        acceptedQuote,
      });
    });

    return { status: "ready", jobs };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Erreur chargement CRM",
      jobs: [],
    };
  }
}
