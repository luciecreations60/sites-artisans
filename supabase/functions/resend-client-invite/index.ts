import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  generateInviteLink,
  isValidEmail,
  normalizeEmail,
  sendOrReturnInviteLink,
} from "../_shared/conversion.ts";

type Body = {
  profile_id?: string;
  send_invitation?: boolean;
};

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

  const profileId = String(body.profile_id ?? "").trim();
  if (!profileId) return jsonResponse({ error: "profile_id requis" }, 400);
  const sendInvitation = body.send_invitation !== false;

  const { data: profile, error: pErr } = await auth.service
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (pErr || !profile) {
    return jsonResponse({ error: "Profil introuvable." }, 404);
  }
  if (profile.role !== "client") {
    return jsonResponse({ error: "Seuls les comptes client peuvent être invités." }, 403);
  }
  if (!profile.email || !isValidEmail(profile.email)) {
    return jsonResponse({ error: "E-mail du profil invalide." }, 400);
  }

  const { data: userData, error: userErr } = await auth.service.auth.admin.getUserById(
    profileId,
  );
  if (userErr || !userData.user) {
    return jsonResponse({ error: "Compte Auth introuvable." }, 404);
  }
  if (userData.user.last_sign_in_at) {
    return jsonResponse(
      { error: "Ce client a déjà activé son compte — pas de renvoi d'invitation." },
      409,
    );
  }

  try {
    const email = normalizeEmail(profile.email);
    const invite = await generateInviteLink(auth.service, email, {
      full_name: profile.full_name ?? undefined,
      company_name: profile.company_name ?? undefined,
    });

    // Ne recrée pas Profile / Project — generateLink régénère seulement le lien
    if (invite.userId !== profileId) {
      return jsonResponse(
        {
          error:
            "Incohérence Auth/profil — abandon du renvoi. Vérifiez l'e-mail du compte.",
        },
        409,
      );
    }

    const invitation = await sendOrReturnInviteLink({
      service: auth.service,
      to: email,
      inviteLink: invite.actionLink,
      companyName: profile.company_name || "votre entreprise",
      contactName: profile.full_name,
      sendInvitation,
    });

    return jsonResponse({
      ok: true,
      profile_id: profileId,
      invitation_sent: invitation.invitation_sent,
      invite_link: invitation.invite_link,
      invitation_error: invitation.invitation_error,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur de renvoi";
    return jsonResponse({ error: msg }, 500);
  }
});
