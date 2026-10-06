export type EmailCapabilities = {
  supportsIndividualSend: boolean;
  supportsQueuedSend: boolean;
  supportsBulkSend: boolean;
  supportsDeliveryWebhooks: boolean;
  supportsBounceWebhooks: boolean;
  supportsInboundReplies: boolean;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
  fromEmail: string;
  fromName: string;
};

export type SendEmailResult = {
  ok: true;
  messageId?: string;
  providerCode: string;
} | {
  ok: false;
  error: string;
  providerCode: string;
};

export interface EmailProvider {
  readonly code: string;
  getCapabilities(): EmailCapabilities;
  testConnection(): Promise<{ ok: boolean; message: string }>;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
