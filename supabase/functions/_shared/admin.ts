import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Supabase service non configuré");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function getUserClient(authHeader: string): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!url || !anon) throw new Error("Supabase anon non configuré");
  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

/** Vérifie JWT + role admin. Retourne user id ou null. */
export async function requireAdmin(
  req: Request,
): Promise<{ userId: string; service: SupabaseClient } | { error: string; status: number }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: "Non authentifié", status: 401 };

  const userClient = getUserClient(authHeader);
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return { error: "Non authentifié", status: 401 };

  const service = getServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: "Accès refusé", status: 403 };
  }

  return { userId: userData.user.id, service };
}

/**
 * Auth pour le worker de file : JWT admin OU en-tête x-crm-cron-secret
 * (secret Edge EMAIL_QUEUE_CRON_SECRET). Jamais de traitement côté navigateur.
 */
export async function requireAdminOrCron(
  req: Request,
): Promise<{ userId: string | null; service: SupabaseClient } | { error: string; status: number }> {
  const cronSecret = (Deno.env.get("EMAIL_QUEUE_CRON_SECRET") ?? "").trim();
  const headerSecret = (req.headers.get("x-crm-cron-secret") ?? "").trim();
  if (cronSecret && headerSecret && headerSecret === cronSecret) {
    return { userId: null, service: getServiceClient() };
  }
  return requireAdmin(req);
}
