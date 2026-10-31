import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { NotificationEventType } from '@prisma/client';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  recipientName?: string;
  subject: string;
  text: string;
  html: string;
  attachments?: EmailAttachment[];
  eventType?: NotificationEventType;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  isSimulated: boolean;
  providerResponse?: string;
  error?: string;
}

export interface TemplateContext {
  recipientName?: string;
  subscriptionNumber?: string;
  planName?: string;
  planPrice?: string | number;
  currency?: string;
  invoiceNumber?: string;
  invoiceAmount?: string | number;
  balanceDue?: string | number;
  dueDate?: string | Date;
  startDate?: string | Date;
  expiryDate?: string | Date;
  paymentNumber?: string;
  paymentAmount?: string | number;
  refundAmount?: string | number;
  reason?: string;
  actionUrl?: string;
  customNotes?: string;
  [key: string]: any;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(
      env.emailEnabled &&
      env.emailHost &&
      env.emailPort &&
      env.emailUser &&
      env.emailPassword
    );

    if (this.isConfigured) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.emailHost,
          port: env.emailPort,
          secure: env.emailSecure,
          auth: {
            user: env.emailUser,
            pass: env.emailPassword,
          },
        });
        console.log(`[EmailService] Live SMTP transport configured for ${env.emailHost}:${env.emailPort}`);
      } catch (err: any) {
        console.error('[EmailService] Failed to initialize live SMTP transport, falling back to simulated mode:', err.message);
        this.transporter = null;
      }
    } else {
      console.log('[EmailService] Running in development simulation mode. Live email sending is DISABLED (EMAIL_ENABLED=false).');
    }
  }

  /**
   * Check whether live email delivery is actively enabled and configured
   */
  public isLiveDeliveryEnabled(): boolean {
    return Boolean(this.isConfigured && this.transporter);
  }

  /**
   * Send an email or simulate sending in development mode
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    // Redact sensitive content if any exists
    const sanitizedSubject = options.subject.replace(/password|secret|bearer/gi, '***');

    if (!this.isLiveDeliveryEnabled() || !this.transporter) {
      // Development mode simulation: capture diagnostics safely without live external network call
      const simulatedMessageId = `sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[EmailService - Simulated] To: ${options.to} | Subject: "${sanitizedSubject}" | Event: ${options.eventType || 'N/A'} | ID: ${simulatedMessageId}`);

      return {
        success: true,
        messageId: simulatedMessageId,
        isSimulated: true,
        providerResponse: 'Simulated local transport accepted delivery (Development Mode)',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: env.emailFrom,
        to: options.recipientName ? `"${options.recipientName}" <${options.to}>` : options.to,
        subject: sanitizedSubject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      return {
        success: true,
        messageId: info.messageId || `live_${Date.now()}`,
        isSimulated: false,
        providerResponse: typeof info.response === 'string' ? info.response : JSON.stringify(info.response),
      };
    } catch (err: any) {
      // Exclude credentials or internal socket secrets from error trace
      const sanitizedError = (err.message || 'SMTP delivery failed')
        .replace(new RegExp(env.emailPassword || '___none___', 'g'), '***')
        .replace(new RegExp(env.emailUser || '___none___', 'g'), '***');

      console.error(`[EmailService] Failed delivering email to ${options.to}:`, sanitizedError);

      return {
        success: false,
        messageId: '',
        isSimulated: false,
        error: sanitizedError,
      };
    }
  }

  /**
   * Render standard responsive HTML template with Brightloop branding
   */
  private renderBaseHtml(title: string, headline: string, bodyContent: string, actionButtonHtml = ''): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F7FA; margin: 0; padding: 0; color: #27212B; }
    .container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #ECE7EE; }
    .header { background: linear-gradient(135deg, #421747 0%, #6D286F 100%); padding: 32px 28px; text-align: left; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: #E996E5; margin: 6px 0 0 0; font-size: 13px; }
    .content { padding: 32px 28px; line-height: 1.6; font-size: 14px; }
    .headline { font-size: 18px; font-weight: 700; color: #421747; margin-top: 0; margin-bottom: 16px; }
    .card { background-color: #FAF8FB; border-radius: 8px; border: 1px solid #ECE7EE; padding: 20px; margin: 20px 0; }
    .card-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #E5DEE8; }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #6D6175; font-size: 13px; font-weight: 500; }
    .card-value { color: #27212B; font-size: 13px; font-weight: 600; text-align: right; }
    .btn-container { text-align: center; margin: 30px 0 10px 0; }
    .btn { display: inline-block; background-color: #6D286F; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.2px; }
    .footer { background-color: #F8F7FA; border-top: 1px solid #ECE7EE; padding: 20px 28px; text-align: center; font-size: 12px; color: #8F8397; }
    .footer p { margin: 4px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${env.companyName}</h1>
      <p>Subscription &amp; Billing Management</p>
    </div>
    <div class="content">
      <div class="headline">${headline}</div>
      ${bodyContent}
      ${actionButtonHtml}
    </div>
    <div class="footer">
      <p><strong>${env.companyName}</strong> &bull; Tax ID: ${env.companyTaxId}</p>
      <p>Have questions? Contact us at <a href="mailto:${env.companyEmail}" style="color: #6D286F;">${env.companyEmail}</a></p>
      <p style="margin-top: 10px; font-size: 11px; color: #A69CB0;">This is an automated transactional notification regarding your account.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Helper to format currency values safely
   */
  private formatAmount(amount?: number | string, currency = 'INR'): string {
    if (amount === undefined || amount === null) return '0.00';
    const num = Number(amount);
    return `${currency === 'INR' ? '₹' : currency + ' '}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Helper to format date safely
   */
  private formatDate(date?: string | Date): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * Render subject, plain text and HTML for all NotificationEventType events
   */
  renderEventTemplate(
    eventType: NotificationEventType,
    ctx: TemplateContext
  ): { subject: string; text: string; html: string } {
    const greeting = `Hello ${ctx.recipientName || 'Valued Customer'},`;
    const currency = ctx.currency || 'INR';

    switch (eventType) {
      case NotificationEventType.SUBSCRIPTION_QUOTATION: {
        const subject = `Quotation for ${ctx.planName || 'Brightloop Subscription'}`;
        const headline = `Your Subscription Quotation is Ready`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Thank you for your interest in <strong>${env.companyName}</strong>. We have prepared an official quotation for your review.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription Reference:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Selected Plan:</span><span class="card-value">${ctx.planName || 'Standard Plan'}</span></div>
            <div class="card-row"><span class="card-label">Total Quotation Value:</span><span class="card-value">${this.formatAmount(ctx.planPrice, currency)}</span></div>
            ${ctx.expiryDate ? `<div class="card-row"><span class="card-label">Quotation Valid Until:</span><span class="card-value">${this.formatDate(ctx.expiryDate)}</span></div>` : ''}
          </div>
          <p>You can review and accept this quotation directly through your portal or by contacting your sales representative.</p>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">View &amp; Accept Quotation</a></div>` : '';
        const text = `${greeting}\n\nYour subscription quotation is ready.\n\nSubscription Reference: ${ctx.subscriptionNumber || 'N/A'}\nSelected Plan: ${ctx.planName || 'Standard'}\nAmount: ${this.formatAmount(ctx.planPrice, currency)}\n\nThank you,\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.SUBSCRIPTION_CONFIRMED: {
        const subject = `Subscription Confirmed: ${ctx.subscriptionNumber || 'Your Plan'}`;
        const headline = `Subscription Confirmed`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Your subscription order has been successfully confirmed. Our team is provisioning your workspace access.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription Reference:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'Standard Plan'}</span></div>
            <div class="card-row"><span class="card-label">Start Date:</span><span class="card-value">${this.formatDate(ctx.startDate)}</span></div>
          </div>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">View Subscription</a></div>` : '';
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} has been confirmed.\nPlan: ${ctx.planName || 'Standard'}\nStart Date: ${this.formatDate(ctx.startDate)}\n\nThank you,\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.SUBSCRIPTION_ACTIVATED: {
        const subject = `Welcome! Subscription Activated: ${ctx.subscriptionNumber || 'Your Account'}`;
        const headline = `Your Subscription is Now Active!`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>We are delighted to confirm that your subscription <strong>${ctx.subscriptionNumber || ''}</strong> has been fully activated.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription Number:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Active Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Effective Date:</span><span class="card-value">${this.formatDate(ctx.startDate)}</span></div>
            ${ctx.expiryDate ? `<div class="card-row"><span class="card-label">Next Renewal / Expiry:</span><span class="card-value">${this.formatDate(ctx.expiryDate)}</span></div>` : ''}
          </div>
          <p>Your team now has complete access to all included features.</p>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">Launch Dashboard</a></div>` : '';
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} (${ctx.planName || ''}) is now active as of ${this.formatDate(ctx.startDate)}.\n\nThank you for choosing ${env.companyName}!`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.SUBSCRIPTION_PAUSED: {
        const subject = `Subscription Paused: ${ctx.subscriptionNumber || ''}`;
        const headline = `Subscription Temporarily Paused`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Your subscription <strong>${ctx.subscriptionNumber || ''}</strong> has been paused as requested.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            ${ctx.reason ? `<div class="card-row"><span class="card-label">Reason:</span><span class="card-value">${ctx.reason}</span></div>` : ''}
          </div>
          <p>Billing cycles and service access are suspended during the pause period. You may resume at any time.</p>
        `;
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} has been paused.\nReason: ${ctx.reason || 'Requested by customer'}\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      case NotificationEventType.SUBSCRIPTION_RESUMED: {
        const subject = `Subscription Resumed: ${ctx.subscriptionNumber || ''}`;
        const headline = `Welcome Back! Your Subscription is Resumed`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Your subscription <strong>${ctx.subscriptionNumber || ''}</strong> has been resumed. All active features and regular billing schedules have restarted.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Resumed On:</span><span class="card-value">${this.formatDate(new Date())}</span></div>
          </div>
        `;
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} has been resumed. Welcome back!\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      case NotificationEventType.SUBSCRIPTION_CLOSED: {
        const subject = `Subscription Closed: ${ctx.subscriptionNumber || ''}`;
        const headline = `Subscription Closure Confirmation`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>This email confirms that your subscription <strong>${ctx.subscriptionNumber || ''}</strong> has been closed.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            ${ctx.reason ? `<div class="card-row"><span class="card-label">Reason:</span><span class="card-value">${ctx.reason}</span></div>` : ''}
            <div class="card-row"><span class="card-label">Closed Date:</span><span class="card-value">${this.formatDate(new Date())}</span></div>
          </div>
          <p>We appreciate having had the opportunity to serve your business. You can reactivate or create a new plan whenever you are ready.</p>
        `;
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} has been closed.\nReason: ${ctx.reason || 'N/A'}\n\nThank you,\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      case NotificationEventType.SUBSCRIPTION_RENEWED: {
        const subject = `Subscription Renewed: ${ctx.subscriptionNumber || ''}`;
        const headline = `Your Subscription Has Renewed`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Your subscription <strong>${ctx.subscriptionNumber || ''}</strong> has renewed successfully.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            ${ctx.expiryDate ? `<div class="card-row"><span class="card-label">New Term Expiry:</span><span class="card-value">${this.formatDate(ctx.expiryDate)}</span></div>` : ''}
          </div>
        `;
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} renewed successfully. New Expiry: ${this.formatDate(ctx.expiryDate)}.\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      case NotificationEventType.SUBSCRIPTION_EXPIRING_SOON: {
        const subject = `Important: Subscription ${ctx.subscriptionNumber || ''} Expiring Soon`;
        const headline = `Upcoming Subscription Expiration Notice`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Your subscription <strong>${ctx.subscriptionNumber || ''}</strong> is approaching its expiration date.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Subscription:</span><span class="card-value">${ctx.subscriptionNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-value">${ctx.planName || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Expiration Date:</span><span class="card-value" style="color: #BA1A1A;">${this.formatDate(ctx.expiryDate)}</span></div>
            <div class="card-row"><span class="card-label">Auto-Renew:</span><span class="card-value">${ctx.autoRenew ? 'Enabled' : 'Disabled'}</span></div>
          </div>
          <p>${ctx.autoRenew ? 'Your subscription will renew automatically on the expiration date.' : 'To ensure uninterrupted access to your services, please review your account and enable renewal.'}</p>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">Manage Renewal</a></div>` : '';
        const text = `${greeting}\n\nYour subscription ${ctx.subscriptionNumber || ''} expires on ${this.formatDate(ctx.expiryDate)}.\nAuto-Renew: ${ctx.autoRenew ? 'Enabled' : 'Disabled'}\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.INVOICE_GENERATED: {
        const subject = `New Invoice Issued: ${ctx.invoiceNumber || 'Invoice'}`;
        const headline = `Your New Invoice is Available`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>An invoice has been generated for your subscription account.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Invoice Number:</span><span class="card-value">${ctx.invoiceNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Invoice Amount:</span><span class="card-value">${this.formatAmount(ctx.invoiceAmount, currency)}</span></div>
            <div class="card-row"><span class="card-label">Payment Due Date:</span><span class="card-value">${this.formatDate(ctx.dueDate)}</span></div>
            <div class="card-row"><span class="card-label">Outstanding Balance:</span><span class="card-value" style="color: #6D286F;">${this.formatAmount(ctx.balanceDue || ctx.invoiceAmount, currency)}</span></div>
          </div>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">View &amp; Pay Invoice</a></div>` : '';
        const text = `${greeting}\n\nA new invoice ${ctx.invoiceNumber || ''} has been issued for ${this.formatAmount(ctx.invoiceAmount, currency)}, due on ${this.formatDate(ctx.dueDate)}.\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.INVOICE_DUE_SOON: {
        const subject = `Payment Reminder: Invoice ${ctx.invoiceNumber || ''} Due Soon`;
        const headline = `Upcoming Payment Reminder`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>This is a gentle reminder that invoice <strong>${ctx.invoiceNumber || ''}</strong> is approaching its payment due date.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Invoice Number:</span><span class="card-value">${ctx.invoiceNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Due Date:</span><span class="card-value" style="color: #BA1A1A;">${this.formatDate(ctx.dueDate)}</span></div>
            <div class="card-row"><span class="card-label">Balance Due:</span><span class="card-value">${this.formatAmount(ctx.balanceDue, currency)}</span></div>
          </div>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn">Settle Invoice Now</a></div>` : '';
        const text = `${greeting}\n\nInvoice ${ctx.invoiceNumber || ''} is due on ${this.formatDate(ctx.dueDate)}. Balance Due: ${this.formatAmount(ctx.balanceDue, currency)}.\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.INVOICE_OVERDUE: {
        const subject = `Urgent: Invoice ${ctx.invoiceNumber || ''} is Overdue`;
        const headline = `Action Required: Invoice Payment Overdue`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>According to our records, invoice <strong>${ctx.invoiceNumber || ''}</strong> has exceeded its payment terms and is currently overdue.</p>
          <div class="card" style="border-left: 4px solid #BA1A1A;">
            <div class="card-row"><span class="card-label">Invoice Number:</span><span class="card-value">${ctx.invoiceNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Original Due Date:</span><span class="card-value">${this.formatDate(ctx.dueDate)}</span></div>
            <div class="card-row"><span class="card-label">Outstanding Balance:</span><span class="card-value" style="color: #BA1A1A;">${this.formatAmount(ctx.balanceDue, currency)}</span></div>
          </div>
          <p>To avoid any disruption to your subscription services, please arrange immediate payment.</p>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn" style="background-color: #BA1A1A;">Pay Outstanding Balance</a></div>` : '';
        const text = `${greeting}\n\nUrgent: Invoice ${ctx.invoiceNumber || ''} is overdue. Balance Due: ${this.formatAmount(ctx.balanceDue, currency)}. Please settle immediately.\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.PAYMENT_SUCCESS: {
        const subject = `Payment Received: Thank You! (${ctx.paymentNumber || 'Receipt'})`;
        const headline = `Payment Confirmation &amp; Receipt`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>Thank you! We have successfully recorded your payment.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Payment Receipt #:</span><span class="card-value">${ctx.paymentNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Invoice Reference:</span><span class="card-value">${ctx.invoiceNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Amount Paid:</span><span class="card-value" style="color: #107C41;">${this.formatAmount(ctx.paymentAmount, currency)}</span></div>
            <div class="card-row"><span class="card-label">Payment Date:</span><span class="card-value">${this.formatDate(new Date())}</span></div>
            ${ctx.balanceDue !== undefined ? `<div class="card-row"><span class="card-label">Remaining Balance:</span><span class="card-value">${this.formatAmount(ctx.balanceDue, currency)}</span></div>` : ''}
          </div>
        `;
        const text = `${greeting}\n\nPayment received: ${this.formatAmount(ctx.paymentAmount, currency)} for Invoice ${ctx.invoiceNumber || 'N/A'} (Receipt: ${ctx.paymentNumber || 'N/A'}).\n\nThank you,\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      case NotificationEventType.PAYMENT_FAILED: {
        const subject = `Payment Failed: Action Needed for ${ctx.invoiceNumber || 'Invoice'}`;
        const headline = `Payment Attempt Failed`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>We were unable to process your payment for invoice <strong>${ctx.invoiceNumber || ''}</strong>.</p>
          <div class="card" style="border-left: 4px solid #BA1A1A;">
            <div class="card-row"><span class="card-label">Invoice:</span><span class="card-value">${ctx.invoiceNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Amount Attempted:</span><span class="card-value">${this.formatAmount(ctx.paymentAmount, currency)}</span></div>
            ${ctx.reason ? `<div class="card-row"><span class="card-label">Failure Reason:</span><span class="card-value">${ctx.reason}</span></div>` : ''}
          </div>
          <p>Please update your payment method or retry the transaction.</p>
        `;
        const actionButton = ctx.actionUrl ? `<div class="btn-container"><a href="${ctx.actionUrl}" class="btn" style="background-color: #BA1A1A;">Retry Payment</a></div>` : '';
        const text = `${greeting}\n\nPayment attempt failed for invoice ${ctx.invoiceNumber || ''}. Reason: ${ctx.reason || 'Declined'}.\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent, actionButton) };
      }

      case NotificationEventType.PAYMENT_REFUNDED: {
        const subject = `Refund Processed: ${ctx.paymentNumber || 'Receipt'}`;
        const headline = `Refund Notice`;
        const bodyContent = `
          <p>${greeting}</p>
          <p>A refund has been processed for your payment <strong>${ctx.paymentNumber || ''}</strong>.</p>
          <div class="card">
            <div class="card-row"><span class="card-label">Payment Reference:</span><span class="card-value">${ctx.paymentNumber || 'N/A'}</span></div>
            <div class="card-row"><span class="card-label">Refund Amount:</span><span class="card-value" style="color: #6D286F;">${this.formatAmount(ctx.refundAmount || ctx.paymentAmount, currency)}</span></div>
            ${ctx.reason ? `<div class="card-row"><span class="card-label">Reason:</span><span class="card-value">${ctx.reason}</span></div>` : ''}
            <div class="card-row"><span class="card-label">Processed Date:</span><span class="card-value">${this.formatDate(new Date())}</span></div>
          </div>
          <p>Depending on your banking institution, funds should reflect in your account within 5-7 business days.</p>
        `;
        const text = `${greeting}\n\nA refund of ${this.formatAmount(ctx.refundAmount || ctx.paymentAmount, currency)} has been processed for payment ${ctx.paymentNumber || ''}.\nReason: ${ctx.reason || 'Customer refund'}\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }

      default: {
        const subject = `Notification from ${env.companyName}`;
        const headline = `Account Notification`;
        const bodyContent = `<p>${greeting}</p><p>${ctx.customNotes || 'You have a new update regarding your account.'}</p>`;
        const text = `${greeting}\n\n${ctx.customNotes || 'You have a new update regarding your account.'}\n\n${env.companyName}`;
        return { subject, text, html: this.renderBaseHtml(subject, headline, bodyContent) };
      }
    }
  }
}

export const emailService = new EmailService();
