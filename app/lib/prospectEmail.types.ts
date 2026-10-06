import type { CrmRef } from "~/lib/crm.types";

export type ProspectEmailType = CrmRef & { is_system: boolean };
export type ProspectEmailStatus = CrmRef & { is_system: boolean };
export type ProspectEmailCampaignStatus = CrmRef & { is_system: boolean };

export type CrmEmailSettings = {
  id: string;
  provider_code: string;
  sender_name: string;
  sender_company: string;
  sender_email: string;
  sender_phone: string | null;
  sender_website: string | null;
  reply_to: string | null;
  email_footer: string | null;
  default_first_follow_up_days: number;
  default_second_follow_up_days: number;
  max_emails_per_day: number;
  max_emails_per_hour: number;
  default_campaign_max_recipients: number;
  created_at: string;
  updated_at: string;
};

export type ProspectEmailTemplate = {
  id: string;
  email_type_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProspectEmailCampaign = {
  id: string;
  name: string;
  status_id: string;
  trade_slug: string | null;
  description: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProspectEmail = {
  id: string;
  prospect_id: string;
  campaign_id: string | null;
  email_type_id: string;
  email_status_id: string;
  template_id: string | null;
  demo_id: string | null;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body_text: string;
  body_html: string | null;
  provider_code: string | null;
  provider_message_id: string | null;
  generated_by_ai: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  ready_at: string | null;
  queued_at: string | null;
  sending_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
};

export const EMAIL_STATUS_CODES = [
  "draft",
  "ready",
  "queued",
  "sending",
  "sent",
  "failed",
  "cancelled",
] as const;

export type EmailStatusCode = (typeof EMAIL_STATUS_CODES)[number];

export const CAMPAIGN_STATUS_CODES = [
  "draft",
  "ready",
  "running",
  "completed",
  "paused",
  "cancelled",
] as const;

export type CampaignStatusCode = (typeof CAMPAIGN_STATUS_CODES)[number];
