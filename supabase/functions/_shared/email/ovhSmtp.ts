import nodemailer from "npm:nodemailer@6";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types.ts";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
};

/** OVH SMTP (ou tout SMTP compatible). Ports 25/587 bloqués sur Edge — utiliser 465. */
export class OvhSmtpEmailProvider implements EmailProvider {
  readonly code = "ovh_smtp";

  constructor(private readonly smtp: SmtpConfig) {}

  getCapabilities() {
    return {
      supportsIndividualSend: true,
      supportsQueuedSend: true,
      supportsBulkSend: false,
      supportsDeliveryWebhooks: false,
      supportsBounceWebhooks: false,
      supportsInboundReplies: false,
    };
  }

  private transport() {
    return nodemailer.createTransport({
      host: this.smtp.host,
      port: this.smtp.port,
      secure: this.smtp.secure,
      auth: {
        user: this.smtp.username,
        pass: this.smtp.password,
      },
    });
  }

  async testConnection() {
    try {
      await this.transport().verify();
      return { ok: true, message: "Connexion SMTP OK." };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec connexion SMTP";
      return { ok: false, message: sanitizeError(msg) };
    }
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const info = await this.transport().sendMail({
        from: `"${input.fromName}" <${input.fromEmail}>`,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        replyTo: input.replyTo || undefined,
      });
      return {
        ok: true,
        messageId: typeof info.messageId === "string" ? info.messageId : undefined,
        providerCode: this.code,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Échec envoi SMTP";
      return {
        ok: false,
        error: sanitizeError(msg),
        providerCode: this.code,
      };
    }
  }
}

function sanitizeError(msg: string): string {
  return msg
    .replace(/pass(word)?[=:]\S+/gi, "password=***")
    .replace(/auth[=:]\S+/gi, "auth=***")
    .slice(0, 500);
}
