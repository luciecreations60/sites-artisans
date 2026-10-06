import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { deliverProspectEmail } from "../_shared/email/deliver.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const auth = await requireAdmin(req);
  if ("error" in auth) return jsonResponse({ error: auth.error }, auth.status);

  let emailId = "";
  try {
    const body = await req.json();
    emailId = String(body?.email_id ?? "");
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, 400);
  }
  if (!emailId) return jsonResponse({ error: "email_id requis" }, 400);

  // Refus si rattaché à une campagne en file (utiliser process-email-queue)
  const { data: email } = await auth.service
    .from("prospect_emails")
    .select("campaign_id, email_status_id, prospect_email_statuses(code)")
    .eq("id", emailId)
    .maybeSingle();
  const st = (email as { prospect_email_statuses?: { code: string } } | null)
    ?.prospect_email_statuses?.code;
  if (email?.campaign_id && st === "queued") {
    return jsonResponse(
      { error: "E-mail en file de campagne — utilisez process-email-queue." },
      409,
    );
  }

  const result = await deliverProspectEmail(auth.service, emailId, "direct");
  if (!result.ok) {
    return jsonResponse({ error: result.error }, result.status ?? 400);
  }
  return jsonResponse({ ok: true, suggest_follow_up: Boolean(result.suggestFollowUp) });
});
