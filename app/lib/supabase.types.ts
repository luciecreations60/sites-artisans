export type AppRole = "admin" | "client";

export type ProjectStatus =
  | "brief"
  | "design"
  | "contenu"
  | "recette"
  | "en_ligne"
  | "maintenance";

export type DocumentKind = "devis" | "facture" | "contrat" | "brief" | "autre";

export type ChangeRequestStatus = "ouvert" | "en_cours" | "termine" | "refuse";

export type Profile = {
  id: string;
  role: AppRole;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  client_id: string;
  title: string;
  trade_slug: string | null;
  offer_tier: "essentiel" | "avance" | "pro" | null;
  status: ProjectStatus;
  domain: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectEvent = {
  id: string;
  project_id: string;
  label: string;
  detail: string | null;
  created_by: string | null;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  project_id: string;
  kind: DocumentKind;
  title: string;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  project_id: string;
  label: string;
  done: boolean;
  due_date: string | null;
  sort_order: number;
};

export type ChangeRequest = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: ChangeRequestStatus;
  created_by: string | null;
  created_at: string;
};

export type MaintenanceQuota = {
  project_id: string;
  hours_included: number;
  hours_used: number;
  period_start: string;
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  brief: "Brief",
  design: "Maquette",
  contenu: "Contenus",
  recette: "Recette",
  en_ligne: "En ligne",
  maintenance: "Maintenance",
};

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  devis: "Devis",
  facture: "Facture",
  contrat: "Contrat",
  brief: "Brief",
  autre: "Autre",
};
