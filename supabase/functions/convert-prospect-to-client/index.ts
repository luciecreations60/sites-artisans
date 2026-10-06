import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  cancelNonSentProspectEmails,
  closeCommercialTasks,
  ensureConversionInteraction,
  ensureProjectCreatedEvent,
  generateInviteLink,
  isValidEmail,
  normalizeEmail,
  releaseLock,
  sendOrReturnInviteLink,
} from "../_shared/conversion.ts";

type Body = {
  prospect_id?: string;
  email?: string;
  full_name?: string;
  company_name?: string;
  phone?: string;
  project_title?: string;
  offer_tier?: string | null;
  trade_slug?: string | null;
  notes?: string | null;
  source_demo_id?: string | null;
  send_invitation?: boolean;
};

const OFFER_TIERS = new Set(["essentiel", "avance", "pro"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const auth = await requireAdmin(req);
  if ("error" in auth) return jsonResponse({ error: auth.error }, auth.status);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Corps JSON invalide" }, 400);
  }

  const prospectId = String(body.prospect_id ?? "").trim();
  if (!prospectId) return jsonResponse({ error: "prospect_id requis" }, 400);

  const projectTitle = String(body.project_title ?? "").trim();
  if (!projectTitle) return jsonResponse({ error: "project_title requis" }, 400);

  const offerTier = body.offer_tier ? String(body.offer_tier) : null;
  if (offerTier && !OFFER_TIERS.has(offerTier)) {
    return jsonResponse({ error: "offer_tier invalide" }, 400);
  }

  const sendInvitation = body.send_invitation !== false;
  const lockToken = crypto.randomUUID();

  const { data: claim, error: claimErr } = await auth.service.rpc(
    "claim_prospect_conversion",
    { p_prospect_id: prospectId, p_token: lockToken },
  );

  if (claimErr) {
    return jsonResponse({ error: claimErr.message }, 500);
  }

  const claimStatus = (claim as { status?: string } | null)?.status;
  if (claimStatus === "not_found") {
    return jsonResponse({ error: "Prospect introuvable." }, 404);
  }
  if (claimStatus === "locked") {
    return jsonResponse({ error: "Conversion déjà en cours." }, 409);
  }
  if (claimStatus === "already_converted") {
    const { data: existingProject } = await auth.service
      .from("projects")
      .select("id")
      .eq("source_prospect_id", prospectId)
      .maybeSingle();
    return jsonResponse({
      ok: true,
      already_converted: true,
      profile_id: (claim as { converted_profile_id?: string }).converted_profile_id,
      project_id: existingProject?.id ?? null,
      invitation_sent: false,
    });
  }
  if (claimStatus !== "claimed") {
    return jsonResponse({ error: "Impossible de démarrer la conversion." }, 500);
  }

  try {
    const { data: prospect, error: pErr } = await auth.service
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .maybeSingle();
    if (pErr || !prospect) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse({ error: "Prospect introuvable." }, 404);
    }

    const emailRaw = String(body.email ?? prospect.email ?? "").trim();
    if (!isValidEmail(emailRaw)) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse({ error: "Adresse e-mail invalide ou manquante." }, 400);
    }
    const email = normalizeEmail(emailRaw);

    const fullName =
      String(body.full_name ?? "").trim() ||
      [prospect.contact_first_name, prospect.contact_last_name]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      null;
    const companyName =
      String(body.company_name ?? "").trim() ||
      prospect.company_name ||
      "Client";
    const phone = String(body.phone ?? prospect.phone ?? "").trim() || null;
    const tradeSlug =
      body.trade_slug != null
        ? String(body.trade_slug).trim() || null
        : prospect.trade_slug;
    const notes = body.notes != null ? String(body.notes).trim() || null : null;
    const sourceDemoId = body.source_demo_id
      ? String(body.source_demo_id).trim() || null
      : null;

    if (sourceDemoId) {
      const { data: demo } = await auth.service
        .from("prospect_demos")
        .select("id")
        .eq("id", sourceDemoId)
        .eq("prospect_id", prospectId)
        .maybeSingle();
      if (!demo) {
        await releaseLock(auth.service, prospectId, lockToken);
        return jsonResponse({ error: "Démo source introuvable pour ce prospect." }, 400);
      }
    }

    const { data: profiles, error: lookupErr } = await auth.service.rpc(
      "find_profiles_by_login_email",
      { p_email: email },
    );
    if (lookupErr) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse({ error: lookupErr.message }, 500);
    }

    const matches = (profiles ?? []) as Array<{
      id: string;
      role: string;
      email: string | null;
      full_name: string | null;
      company_name: string | null;
      phone: string | null;
    }>;

    if (matches.length > 1) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse(
        {
          error:
            "Plusieurs profils partagent cet e-mail — correction manuelle requise avant conversion.",
        },
        409,
      );
    }

    if (matches.length === 1 && matches[0].role === "admin") {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse(
        { error: "Cet e-mail appartient à un compte administrateur." },
        403,
      );
    }

    let profileId: string;
    let isNewClient = false;
    let inviteLink: string | null = null;

    if (matches.length === 1) {
      profileId = matches[0].id;
      await auth.service
        .from("profiles")
        .update({
          full_name: fullName ?? matches[0].full_name,
          company_name: companyName || matches[0].company_name,
          phone: phone ?? matches[0].phone,
          email,
        })
        .eq("id", profileId);
    } else {
      isNewClient = true;
      const invite = await generateInviteLink(auth.service, email, {
        full_name: fullName ?? undefined,
        company_name: companyName,
      });
      profileId = invite.userId;
      inviteLink = invite.actionLink;

      // Attendre / garantir le profil (trigger handle_new_user)
      for (let i = 0; i < 8; i++) {
        const { data: prof } = await auth.service
          .from("profiles")
          .select("id")
          .eq("id", profileId)
          .maybeSingle();
        if (prof) break;
        await new Promise((r) => setTimeout(r, 150));
      }

      const { data: existingProf } = await auth.service
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle();

      if (!existingProf) {
        const { error: insErr } = await auth.service.from("profiles").insert({
          id: profileId,
          role: "client",
          full_name: fullName,
          company_name: companyName,
          phone,
          email,
        });
        if (insErr) {
          await releaseLock(auth.service, prospectId, lockToken);
          return jsonResponse({ error: insErr.message }, 500);
        }
      } else {
        await auth.service
          .from("profiles")
          .update({
            role: "client",
            full_name: fullName,
            company_name: companyName,
            phone,
            email,
          })
          .eq("id", profileId);
      }
    }

    // Project : find or create (unique source_prospect_id)
    let { data: project } = await auth.service
      .from("projects")
      .select("*")
      .eq("source_prospect_id", prospectId)
      .maybeSingle();

    if (!project) {
      const { data: inserted, error: projErr } = await auth.service
        .from("projects")
        .insert({
          client_id: profileId,
          title: projectTitle,
          trade_slug: tradeSlug,
          offer_tier: offerTier,
          status: "brief",
          notes,
          source_prospect_id: prospectId,
          source_demo_id: sourceDemoId,
        })
        .select("*")
        .maybeSingle();

      if (projErr) {
        // Race UNIQUE → réutiliser
        const { data: raced } = await auth.service
          .from("projects")
          .select("*")
          .eq("source_prospect_id", prospectId)
          .maybeSingle();
        if (!raced) {
          await releaseLock(auth.service, prospectId, lockToken);
          return jsonResponse({ error: projErr.message }, 500);
        }
        project = raced;
      } else {
        project = inserted;
      }
    }

    if (!project) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse({ error: "Impossible de créer ou retrouver le projet." }, 500);
    }

    // Si projet existant d'une tentative précédente : aligner client_id / champs utiles
    if (project.client_id !== profileId || project.source_demo_id !== sourceDemoId) {
      await auth.service
        .from("projects")
        .update({
          client_id: profileId,
          title: project.title || projectTitle,
          trade_slug: project.trade_slug ?? tradeSlug,
          offer_tier: project.offer_tier ?? offerTier,
          notes: project.notes ?? notes,
          source_demo_id: project.source_demo_id ?? sourceDemoId,
        })
        .eq("id", project.id);
    }

    await ensureProjectCreatedEvent(
      auth.service,
      project.id,
      auth.userId,
      `Issu du prospect ${prospect.company_name}`,
    );

    await cancelNonSentProspectEmails(
      auth.service,
      prospectId,
      "Prospect devenu client",
    );

    await closeCommercialTasks(auth.service, prospectId);

    await ensureConversionInteraction(
      auth.service,
      prospectId,
      auth.userId,
      `Client ${companyName} · projet ${projectTitle}`,
    );

    const { data: gagne } = await auth.service
      .from("prospect_statuses")
      .select("id")
      .eq("code", "gagne")
      .maybeSingle();

    const { error: markErr } = await auth.service
      .from("prospects")
      .update({
        status_id: gagne?.id ?? prospect.status_id,
        converted_profile_id: profileId,
        converted_at: new Date().toISOString(),
        converted_by: auth.userId,
        conversion_lock_at: null,
        conversion_lock_token: null,
      })
      .eq("id", prospectId)
      .eq("conversion_lock_token", lockToken);

    if (markErr) {
      await releaseLock(auth.service, prospectId, lockToken);
      return jsonResponse({ error: markErr.message }, 500);
    }

    let invitation: {
      invitation_sent: boolean;
      invite_link?: string;
      invitation_error?: string;
    } = { invitation_sent: false };

    if (isNewClient && inviteLink) {
      invitation = await sendOrReturnInviteLink({
        service: auth.service,
        to: email,
        inviteLink,
        companyName,
        contactName: fullName,
        sendInvitation,
      });
    }

    return jsonResponse({
      ok: true,
      already_converted: false,
      is_new_client: isNewClient,
      profile_id: profileId,
      project_id: project.id,
      invitation_sent: invitation.invitation_sent,
      invite_link: invitation.invite_link,
      invitation_error: invitation.invitation_error,
    });
  } catch (e) {
    await releaseLock(auth.service, prospectId, lockToken);
    const msg = e instanceof Error ? e.message : "Erreur de conversion";
    return jsonResponse({ error: msg }, 500);
  }
});
