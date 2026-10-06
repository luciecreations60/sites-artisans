import { getSupabase } from "~/lib/supabase";

export async function invokeSendProspectEmail(emailId: string): Promise<{
  ok: boolean;
  suggest_follow_up?: boolean;
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb.functions.invoke("send-prospect-email", {
    body: { email_id: emailId },
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: String(data.error) };
  return {
    ok: true,
    suggest_follow_up: Boolean(data?.suggest_follow_up),
  };
}

export async function invokeProcessEmailQueue(): Promise<{
  ok: boolean;
  processed?: number;
  error?: string;
  message?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb.functions.invoke("process-email-queue", {
    body: {},
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error && data?.processed == null) {
    return { ok: false, error: String(data.error) };
  }
  return {
    ok: true,
    processed: Number(data?.processed ?? 0),
    message: data?.message ? String(data.message) : data?.error ? String(data.error) : undefined,
  };
}

export async function invokeTestEmailProvider(): Promise<{
  ok: boolean;
  configured?: boolean;
  provider_code?: string;
  test?: { ok: boolean; message: string };
  error?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "Supabase non configuré" };
  const { data, error } = await sb.functions.invoke("test-email-provider", {
    body: {},
  });
  if (error) return { ok: false, error: error.message };
  if (data?.error) return { ok: false, error: String(data.error) };
  return {
    ok: true,
    configured: Boolean(data?.configured),
    provider_code: data?.provider_code,
    test: data?.test,
  };
}
