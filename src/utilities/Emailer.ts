import postmark from 'postmark';
import { withRetry } from './HelperFunctions';
import Logger from './Logger';

type EmailAddress = string | { name?: string; email: string };

interface EmailOptions {
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  cc?: EmailAddress | EmailAddress[];
  bcc?: EmailAddress | EmailAddress[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  templateId?: number;
  templateModel?: Record<string, any>;
  attachments?: postmark.Models.Attachment[] | undefined;
  trackOpens?: boolean;
  trackLinks?: postmark.Models.LinkTrackingOptions | undefined;
  metadata?: Record<string, string>;
}

export class EmailHandler {
  private client: postmark.ServerClient;
  private defaultFrom: EmailAddress;
  private logger: Logger;

  constructor(postmarkToken: string, defaultFrom: EmailAddress, logger: Logger) {
    this.client = new postmark.ServerClient(postmarkToken);
    this.defaultFrom = defaultFrom;
    this.logger = logger;
  }

  /**
   * Send email with retry logic
   */
  async sendEmail(options: EmailOptions): Promise<postmark.Models.MessageSendingResponse> {
    // Use default 'from' if not specified
    const from = options.from || this.defaultFrom;

    return withRetry(
      async () => {
        if (!options.textBody && !options.htmlBody) {
          throw new Error('Either textBody, htmlBody or templateId must be provided');
        }

        this.logger.info(`Sending email from ${from} to ${options.to}`);
        return this.client.sendEmail({
          From: this.formatAddress(from),
          To: this.formatAddress(options.to),
          Cc: options.cc ? this.formatAddress(options.cc) : undefined,
          Bcc: options.bcc ? this.formatAddress(options.bcc) : undefined,
          Subject: options.subject,
          TextBody: options.textBody,
          HtmlBody: options.htmlBody,
          Attachments: options.attachments,
          TrackOpens: options.trackOpens,
          TrackLinks: options.trackLinks,
          Metadata: options.metadata,
        });
      },
      {
        retries: 3,
        delay: 1000,
      },
    );
  }

  /**
   * Format email addresses for Postmark
   */
  private formatAddress(address: EmailAddress | EmailAddress[]): string {
    if (Array.isArray(address)) {
      return address.map((a) => this.formatSingleAddress(a)).join(',');
    }
    return this.formatSingleAddress(address);
  }

  private formatSingleAddress(address: EmailAddress): string {
    if (typeof address === 'string') return address;
    return address.name ? `"${address.name}" <${address.email}>` : address.email;
  }

  /**
   * Send batch emails (for bulk operations)
   */
  async sendBatchEmails(messages: EmailOptions[]): Promise<postmark.Models.MessageSendingResponse[]> {
    return withRetry(
      async () => {
        const formattedMessages = messages.map((msg) => ({
          From: this.formatAddress(msg.from || this.defaultFrom),
          To: this.formatAddress(msg.to),
          Cc: msg.cc ? this.formatAddress(msg.cc) : undefined,
          Bcc: msg.bcc ? this.formatAddress(msg.bcc) : undefined,
          Subject: msg.subject,
          TextBody: msg.textBody,
          HtmlBody: msg.htmlBody,
          TemplateId: msg.templateId,
          TemplateModel: msg.templateModel,
          Attachments: msg.attachments,
          TrackOpens: msg.trackOpens,
          TrackLinks: msg.trackLinks,
          Metadata: msg.metadata,
        }));

        return this.client.sendEmailBatch(formattedMessages);
      },
      {
        retries: 3,
        delay: 2000,
      },
    );
  }

  /**
   * Get delivery status
   */
  async getDeliveryStatus(messageId: string): Promise<postmark.Models.OutboundMessageDetails> {
    return this.client.getOutboundMessageDetails(messageId);
  }
}
