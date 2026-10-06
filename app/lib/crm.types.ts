export type CrmRef = {
  id: string;
  code: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type ProspectStatus = CrmRef & {
  is_closed: boolean;
  is_won: boolean;
};

export type ProspectInteractionType = CrmRef & {
  is_system: boolean;
  counts_as_contact: boolean;
};

export type Prospect = {
  id: string;
  company_name: string;
  commercial_name: string | null;
  trade_slug: string | null;
  specialty: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  department: string | null;
  service_area: string | null;
  website_url: string | null;
  google_business_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  status_id: string;
  priority_id: string;
  source_id: string | null;
  analysis_flags: string[];
  analysis_notes: string | null;
  internal_notes: string | null;
  do_not_contact: boolean;
  do_not_contact_reason_id: string | null;
  do_not_contact_note: string | null;
  do_not_contact_at: string | null;
  do_not_contact_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  converted_profile_id: string | null;
  converted_at: string | null;
  converted_by: string | null;
  conversion_lock_at: string | null;
  conversion_lock_token: string | null;
};

export type ProspectTask = {
  id: string;
  prospect_id: string;
  task_type_id: string;
  title: string;
  detail: string | null;
  due_at: string;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProspectInteraction = {
  id: string;
  prospect_id: string;
  interaction_type_id: string;
  title: string | null;
  detail: string | null;
  created_by: string | null;
  created_at: string;
};

export type ProspectTagLink = {
  prospect_id: string;
  tag_id: string;
  created_at: string;
};

export type ProspectDemoStatusRef = CrmRef & {
  is_system: boolean;
};

export type ProspectEmailTypeRef = CrmRef & {
  is_system: boolean;
};

export type ProspectEmailStatusRef = CrmRef & {
  is_system: boolean;
};

export type ProspectEmailCampaignStatusRef = CrmRef & {
  is_system: boolean;
};

export type CrmRefs = {
  statuses: ProspectStatus[];
  sources: CrmRef[];
  priorities: CrmRef[];
  taskTypes: CrmRef[];
  interactionTypes: ProspectInteractionType[];
  dncReasons: CrmRef[];
  tags: CrmRef[];
  demoStatuses: ProspectDemoStatusRef[];
  emailTypes: ProspectEmailTypeRef[];
  emailStatuses: ProspectEmailStatusRef[];
  campaignStatuses: ProspectEmailCampaignStatusRef[];
};
