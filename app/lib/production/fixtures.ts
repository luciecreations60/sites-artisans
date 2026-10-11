import type { ProductionJob, SiteContent } from "./types.ts";

export const emptySiteContent = (isTestFixture = false): SiteContent => ({
  activityDescription: "",
  servicesDetail: "",
  publicPhone: "",
  publicEmail: "",
  publicAddress: "",
  hours: "",
  serviceArea: "",
  aboutText: "",
  teamText: "",
  pricingNotes: "",
  realizationsNotes: "",
  bookingUrl: "",
  legalMentions: "",
  externalLinks: "",
  logoPresent: false,
  photoCount: 0,
  imageRightsConfirmed: false,
  isTestFixture,
});

/** Fixture TEST — génération locale autorisée, livraison réelle interdite. */
export function createTestProductionJob(
  over: Partial<ProductionJob> = {},
): ProductionJob {
  const content = emptySiteContent(true);
  content.activityDescription = "[TEST] Plomberie dépannage Senlis";
  content.aboutText = "[TEST] Entreprise fictive pour validation du générateur.";
  content.publicPhone = "01 00 00 00 00";
  content.publicEmail = "test@example.invalid";
  content.publicAddress = "1 rue du Test, 60300 Senlis";
  content.hours = "Lun–Ven 8h–18h";
  content.serviceArea = "Senlis et alentours";
  content.servicesDetail = "Dépannage, installation, entretien";
  content.legalMentions = "[TEST] Mentions légales fictives — ne pas publier.";
  content.logoPresent = true;
  content.photoCount = 3;
  content.imageRightsConfirmed = true;

  return {
    id: "prod_test_essentiel",
    projectId: "proj_test_001",
    projectTitle: "[TEST] Dupont Plomberie",
    clientName: "Client Test",
    companyName: "[TEST] Dupont Plomberie",
    tradeSlug: "plombier",
    planId: "essentiel",
    configurationId: "cfg_test_001",
    prepStatus: "ready_to_generate",
    config: {
      formatVersion: 1,
      configurationId: "cfg_test_001",
      tradeSlug: "plombier",
      planId: "essentiel",
      companyName: "[TEST] Dupont Plomberie",
      city: "Senlis",
      specialty: "Dépannage",
      themeId: "sage",
      fontId: "classic",
      desiredFeatureIds: ["gallery_basic", "contact_form", "about_company", "services_list"],
      featureQuantities: {},
      profileSnapshot: {
        company: "[TEST] Dupont Plomberie",
        city: "Senlis",
        specialty: "Dépannage",
        themeId: "sage",
        fontId: "classic",
      },
      acceptedQuoteReference: null,
      acceptedQuoteId: null,
    },
    content,
    meetingNotes: [],
    proposals: [],
    generations: [],
    hosting: {
      provider: "",
      domain: "",
      notes: "Le client possède et paie son hébergement.",
      clientOwnsHosting: true,
    },
    lastGenerationAt: null,
    validationInternal: false,
    validationClient: false,
    backendAvailable: false,
    isTestFixture: true,
    ...over,
  };
}

export function createTestAvanceJob(): ProductionJob {
  const base = createTestProductionJob({
    id: "prod_test_avance",
    planId: "avance",
    projectTitle: "[TEST] Atelier Avancé",
    companyName: "[TEST] Atelier Avancé",
  });
  base.config.planId = "avance";
  base.config.companyName = "[TEST] Atelier Avancé";
  base.config.desiredFeatureIds = [
    ...base.config.desiredFeatureIds,
    "gallery_filter",
    "guided_quote",
  ];
  base.content.photoCount = 4;
  return base;
}

export function createTestProJob(): ProductionJob {
  const base = createTestProductionJob({
    id: "prod_test_pro",
    planId: "pro",
    tradeSlug: "electricien",
    projectTitle: "[TEST] Pro Électricité",
    companyName: "[TEST] Pro Électricité",
  });
  base.config.planId = "pro";
  base.config.tradeSlug = "electricien";
  base.config.companyName = "[TEST] Pro Électricité";
  base.config.desiredFeatureIds = [
    "gallery_basic",
    "contact_form",
    "about_company",
    "services_list",
    "before_after",
    "estimator",
  ];
  base.content.photoCount = 6;
  base.content.bookingUrl = "";
  return base;
}

/** Job incomplet — doit refuser la production live. */
export function createIncompleteLiveJob(): ProductionJob {
  const job = createTestProductionJob({
    id: "prod_incomplete",
    isTestFixture: false,
    backendAvailable: false,
    configurationId: null,
    projectId: "",
  });
  job.content.isTestFixture = false;
  job.config.acceptedQuoteReference = null;
  job.config.configurationId = null;
  return job;
}
