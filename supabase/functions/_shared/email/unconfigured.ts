import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types.ts";

export class UnconfiguredEmailProvider implements EmailProvider {
  readonly code = "unconfigured";

  getCapabilities() {
    return {
      supportsIndividualSend: false,
      supportsQueuedSend: false,
      supportsBulkSend: false,
      supportsDeliveryWebhooks: false,
      supportsBounceWebhooks: false,
      supportsInboundReplies: false,
    };
  }

  async testConnection() {
    return {
      ok: false,
      message: "Service d'envoi non configuré.",
    };
  }

  async sendEmail(_input: SendEmailInput): Promise<SendEmailResult> {
    return {
      ok: false,
      error: "Service d'envoi non configuré.",
      providerCode: this.code,
    };
  }
}
