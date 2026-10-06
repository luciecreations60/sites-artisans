import { requireAdmin } from "../_shared/admin.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getEmailProvider, isProviderConfigured } from "../_shared/email/factory.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const auth = await requireAdmin(req);
  if ("error" in auth) return jsonResponse({ error: auth.error }, auth.status);

  const provider = getEmailProvider();
  const caps = provider.getCapabilities();
  const test = await provider.testConnection();

  return jsonResponse({
    configured: isProviderConfigured(),
    provider_code: provider.code,
    capabilities: caps,
    test,
    // Jamais de secrets
  });
});
