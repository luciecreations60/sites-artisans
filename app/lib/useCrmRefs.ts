import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "~/lib/supabase";
import type {
  CrmRef,
  CrmRefs,
  ProspectDemoStatusRef,
  ProspectEmailCampaignStatusRef,
  ProspectEmailStatusRef,
  ProspectEmailTypeRef,
  ProspectInteractionType,
  ProspectStatus,
} from "~/lib/crm.types";

const empty: CrmRefs = {
  statuses: [],
  sources: [],
  priorities: [],
  taskTypes: [],
  interactionTypes: [],
  dncReasons: [],
  tags: [],
  demoStatuses: [],
  emailTypes: [],
  emailStatuses: [],
  campaignStatuses: [],
};

export function useCrmRefs() {
  const [refs, setRefs] = useState<CrmRefs>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    const [
      statuses,
      sources,
      priorities,
      taskTypes,
      interactionTypes,
      dncReasons,
      tags,
      demoStatuses,
      emailTypes,
      emailStatuses,
      campaignStatuses,
    ] = await Promise.all([
      sb.from("prospect_statuses").select("*").order("sort_order"),
      sb.from("prospect_sources").select("*").order("sort_order"),
      sb.from("prospect_priorities").select("*").order("sort_order"),
      sb.from("prospect_task_types").select("*").order("sort_order"),
      sb.from("prospect_interaction_types").select("*").order("sort_order"),
      sb.from("prospect_do_not_contact_reasons").select("*").order("sort_order"),
      sb.from("prospect_tags").select("*").order("sort_order"),
      sb.from("prospect_demo_statuses").select("*").order("sort_order"),
      sb.from("prospect_email_types").select("*").order("sort_order"),
      sb.from("prospect_email_statuses").select("*").order("sort_order"),
      sb.from("prospect_email_campaign_statuses").select("*").order("sort_order"),
    ]);
    const err =
      statuses.error?.message ||
      sources.error?.message ||
      priorities.error?.message ||
      taskTypes.error?.message ||
      interactionTypes.error?.message ||
      dncReasons.error?.message ||
      tags.error?.message ||
      demoStatuses.error?.message ||
      emailTypes.error?.message ||
      emailStatuses.error?.message ||
      campaignStatuses.error?.message;
    if (err) setError(err);
    setRefs({
      statuses: (statuses.data as ProspectStatus[]) ?? [],
      sources: (sources.data as CrmRef[]) ?? [],
      priorities: (priorities.data as CrmRef[]) ?? [],
      taskTypes: (taskTypes.data as CrmRef[]) ?? [],
      interactionTypes: (interactionTypes.data as ProspectInteractionType[]) ?? [],
      dncReasons: (dncReasons.data as CrmRef[]) ?? [],
      tags: (tags.data as CrmRef[]) ?? [],
      demoStatuses: (demoStatuses.data as ProspectDemoStatusRef[]) ?? [],
      emailTypes: (emailTypes.data as ProspectEmailTypeRef[]) ?? [],
      emailStatuses: (emailStatuses.data as ProspectEmailStatusRef[]) ?? [],
      campaignStatuses: (campaignStatuses.data as ProspectEmailCampaignStatusRef[]) ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function byId<T extends { id: string }>(list: T[], id: string | null | undefined) {
    if (!id) return undefined;
    return list.find((x) => x.id === id);
  }

  function byCode<T extends { code: string }>(list: T[], code: string) {
    return list.find((x) => x.code === code);
  }

  function activeOnly<T extends { is_active: boolean }>(list: T[]) {
    return list.filter((x) => x.is_active);
  }

  return { refs, loading, error, reload, byId, byCode, activeOnly };
}
