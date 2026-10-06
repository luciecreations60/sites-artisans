import { getSupabase } from "~/lib/supabase";
import type { OfferTier } from "~/lib/supabase.types";

export type ConvertProspectPayload = {
  prospect_id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  project_title: string;
  offer_tier?: OfferTier | null;
  trade_slug?: string | null;
  notes?: string | null;
  source_demo_id?: string | null;
  send_invitation?: boolean;
};

export type ConvertProspectResult = {
  ok: boolean;
  already_converted?: boolean;
  is_new_client?: boolean;
  profile_id?: string;
  project_id?: string | null;
  invitation_sent?: boolean;
  invite_link?: string;
  invitation_error?: string;
  error?: string;
};

export async function invokeConvertProspectToClient(
  payload: ConvertProspectPayload,
): Promise<ConvertProspectResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb.functions.invoke("convert-prospect-to-client", {
    body: payload,
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: String(data.error) };
  return {
    ok: true,
    already_converted: Boolean(data?.already_converted),
    is_new_client: Boolean(data?.is_new_client),
    profile_id: data?.profile_id ? String(data.profile_id) : undefined,
    project_id: data?.project_id ? String(data.project_id) : null,
    invitation_sent: Boolean(data?.invitation_sent),
    invite_link: data?.invite_link ? String(data.invite_link) : undefined,
    invitation_error: data?.invitation_error
      ? String(data.invitation_error)
      : undefined,
  };
}

export type ResendInviteResult = {
  ok: boolean;
  invitation_sent?: boolean;
  invite_link?: string;
  invitation_error?: string;
  error?: string;
};

export async function invokeResendClientInvite(
  profileId: string,
  sendInvitation = true,
): Promise<ResendInviteResult> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb.functions.invoke("resend-client-invite", {
    body: { profile_id: profileId, send_invitation: sendInvitation },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: String(data.error) };
  return {
    ok: true,
    invitation_sent: Boolean(data?.invitation_sent),
    invite_link: data?.invite_link ? String(data.invite_link) : undefined,
    invitation_error: data?.invitation_error
      ? String(data.invitation_error)
      : undefined,
  };
}
