import { OvhSmtpEmailProvider } from "./ovhSmtp.ts";
import type { EmailProvider } from "./types.ts";
import { UnconfiguredEmailProvider } from "./unconfigured.ts";

function env(name: string): string {
  return (Deno.env.get(name) ?? "").trim();
}

export function getEmailProvider(): EmailProvider {
  const code = env("EMAIL_PROVIDER") || "ovh_smtp";
  const host = env("SMTP_HOST");
  const username = env("SMTP_USERNAME");
  const password = env("SMTP_PASSWORD");
  const from = env("SMTP_FROM_EMAIL");

  if (!host || !username || !password || !from) {
    return new UnconfiguredEmailProvider();
  }

  if (code === "ovh_smtp") {
    const port = Number(env("SMTP_PORT") || "465");
    const secureEnv = env("SMTP_SECURE");
    const secure = secureEnv ? secureEnv === "true" || secureEnv === "1" : port === 465;
    return new OvhSmtpEmailProvider({
      host,
      port: Number.isFinite(port) ? port : 465,
      secure,
      username,
      password,
    });
  }

  return new UnconfiguredEmailProvider();
}

export function getSmtpFromDefaults() {
  return {
    fromEmail: env("SMTP_FROM_EMAIL"),
    fromName: env("SMTP_FROM_NAME") || "Sites Artisans",
    replyTo: env("SMTP_REPLY_TO"),
  };
}

export function isProviderConfigured(): boolean {
  return getEmailProvider().code !== "unconfigured";
}
