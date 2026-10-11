import type { OfferTier, TradeSlug } from "../../data/types";

/** Statuts atelier production (distincts du pipeline CRM projects.status). */
export type ProductionPrepStatus =
  | "to_prepare"
  | "content_incomplete"
  | "ready_to_generate"
  | "to_review"
  | "client_validation"
  | "ready_to_deliver"
  | "delivered";

export const PRODUCTION_STATUS_LABELS: Record<ProductionPrepStatus, string> = {
  to_prepare: "À préparer",
  content_incomplete: "Contenus incomplets",
  ready_to_generate: "Prêt à générer",
  to_review: "À vérifier",
  client_validation: "Validation client",
  ready_to_deliver: "Prêt à livrer",
  delivered: "Livré",
};

export type HostingInfo = {
  provider: string;
  domain: string;
  notes: string;
  clientOwnsHosting: true;
};

export type SiteContent = {
  activityDescription: string;
  servicesDetail: string;
  publicPhone: string;
  publicEmail: string;
  publicAddress: string;
  hours: string;
  serviceArea: string;
  aboutText: string;
  teamText: string;
  pricingNotes: string;
  realizationsNotes: string;
  bookingUrl: string;
  legalMentions: string;
  externalLinks: string;
  logoPresent: boolean;
  photoCount: number;
  imageRightsConfirmed: boolean;
  /** Contenu clairement marqué TEST — jamais livrable comme réel. */
  isTestFixture: boolean;
};

export type ProductionConfigSnapshot = {
  formatVersion: 1;
  configurationId: string | null;
  tradeSlug: TradeSlug;
  planId: OfferTier;
  companyName: string;
  city: string;
  specialty: string;
  themeId: string;
  fontId: string;
  desiredFeatureIds: string[];
  featureQuantities: Record<string, number>;
  profileSnapshot: Record<string, unknown>;
  /** Référence devis accepté — lecture seule, jamais modifiée ici. */
  acceptedQuoteReference: string | null;
  acceptedQuoteId: string | null;
};

export type MeetingNoteStatus = "draft" | "validated";

export type MeetingNote = {
  id: string;
  title: string;
  meetingDate: string;
  body: string;
  internalNotes: string;
  status: MeetingNoteStatus;
  /** Visible client uniquement si explicitement autorisé. */
  shareWithClient: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProposalSource = "meeting_note" | "manual" | "import";

export type ContentProposal = {
  id: string;
  field: keyof SiteContent | "companyName" | "city" | "specialty" | "featureRequest";
  currentValue: string;
  proposedValue: string;
  source: ProposalSource;
  sourceLabel: string;
  /** Si true : hors périmètre devis — avenant requis, pas d’application contractuelle. */
  requiresCommercialReview: boolean;
  status: "pending" | "accepted" | "ignored" | "edited";
};

export type GenerationRecord = {
  id: string;
  projectId: string;
  templateVersion: string;
  configVersion: string;
  modules: string[];
  generatedAt: string;
  result: "success" | "failure";
  errorMessage: string | null;
  outputDir: string | null;
  /** Ne jamais écraser une version validée silencieusement. */
  superseded: boolean;
};

export type ProductionJob = {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  companyName: string;
  tradeSlug: TradeSlug;
  planId: OfferTier;
  configurationId: string | null;
  prepStatus: ProductionPrepStatus;
  config: ProductionConfigSnapshot;
  content: SiteContent;
  meetingNotes: MeetingNote[];
  proposals: ContentProposal[];
  generations: GenerationRecord[];
  hosting: HostingInfo;
  lastGenerationAt: string | null;
  validationInternal: boolean;
  validationClient: boolean;
  backendAvailable: boolean;
  isTestFixture: boolean;
};

export type ChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  dependsOn?: string;
};

export type ProductionEligibility =
  | { ok: true; mode: "live" | "test_fixture" }
  | {
      ok: false;
      reasons: string[];
    };
