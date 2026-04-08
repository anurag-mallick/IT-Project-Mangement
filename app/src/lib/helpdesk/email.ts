import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

let transporters: Map<number, nodemailer.Transporter> = new Map();

interface EmailAccountConfig {
  id: number;
  smtpHost: string | null;
  smtpPort: number;
  smtpSSL: boolean;
  smtpTls: boolean;
  username: string;
  password: string;
}

async function getTransporter(accountId?: number) {
  if (accountId && transporters.has(accountId)) {
    return transporters.get(accountId)!;
  }

  let config: EmailAccountConfig | null = null;
  if (accountId) {
    config = await prisma.emailAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true, smtpHost: true, smtpPort: true, smtpSSL: true, smtpTls: true,
        username: true, password: true
      }
    }) as EmailAccountConfig | null;
  }

  const host = config?.smtpHost || process.env.SMTP_HOST;
  const port = config?.smtpPort || parseInt(process.env.SMTP_PORT || '587');
  const secure = config?.smtpSSL ?? (process.env.SMTP_SECURE === 'true');
  const user = config?.username || process.env.SMTP_USER;
  const pass = config?.password || process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration missing');
  }

  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });

  if (accountId) transporters.set(accountId, transporter);
  return transporter;
}

function getBaseTemplate(title: string, content: string, actionUrl?: string, actionLabel?: string) {
  const primaryColor = '#2563eb';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
  .header { background: ${primaryColor}; padding: 32px; text-align: center; color: white; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .content { padding: 32px; }
  .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
  .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
  .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .meta-item { display: flex; margin-bottom: 8px; font-size: 14px; }
  .meta-label { font-weight: 600; width: 100px; color: #64748b; }
</style></head>
<body>
  <div class="container">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${content}${actionUrl ? `<div style="text-align: center;"><a href="${actionUrl}" class="button">${actionLabel || 'View Details'}</a></div>` : ''}</div>
    <div class="footer">&copy; ${new Date().getFullYear()} IT Support. All rights reserved.<br/>This is an automated notification.</div>
  </div>
</body></html>`;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string;
  inReplyTo?: string;
  references?: string;
  accountId?: number;
}) {
  const transporter = await getTransporter(options.accountId);
  const account = options.accountId 
    ? await prisma.emailAccount.findUnique({ where: { id: options.accountId } })
    : null;

  const info = await transporter.sendMail({
    from: options.from || (account ? `"${account.emailAccountName}" <${account.email}>` : process.env.SMTP_FROM),
    to: options.to,
    cc: options.cc,
    subject: options.subject,
    html: options.html,
    inReplyTo: options.inReplyTo,
    references: options.references
  });

  return info;
}

export async function sendTicketEmail(params: {
  type: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RESOLVED' | 'USER_CREATED' | 'NEW_COMMENT' | 'SLA_WARNING' | 'REPLY' | 'ACKNOWLEDGEMENT' | 'FEEDBACK_REQUEST';
  ticket?: any;
  recipient: { email: string; name: string };
  password?: string;
  comment?: string;
  emailAccountId?: number;
  inReplyTo?: string;
  references?: string;
}) {
  const { type, ticket, recipient, password, comment, emailAccountId, inReplyTo, references } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ticketUrl = ticket ? `${appUrl}/tickets/${ticket.id}` : appUrl;
  let subject = '';
  let html = '';

  switch (type) {
    case 'USER_CREATED':
      subject = 'Welcome to IT Support';
      html = getBaseTemplate('Account Created',
        `<p>Hello ${recipient.name},</p><p>Your account has been set up. Login with:<br/><strong>Email:</strong> ${recipient.email}</p><p><strong>Password:</strong> <code>${password || 'Welcome@123'}</code></p>`,
        appUrl, 'Login');
      break;
    case 'CREATED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] New Ticket: ${ticket.title}`;
      html = getBaseTemplate('New Ticket Created',
        `<p>A new ticket has been created:</p><div class="meta-box">
          <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
          <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
          <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
        </div>`,
        ticketUrl);
      break;
    case 'ASSIGNED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] Assigned to You: ${ticket.title}`;
      html = getBaseTemplate('Ticket Assigned',
        `<p>Hello ${recipient.name}, you have been assigned to ticket #${ticket.id}:</p><div class="meta-box">
          <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
          <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
        </div>`,
        ticketUrl);
      break;
    case 'RESOLVED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] Ticket Resolved: ${ticket.title}`;
      html = getBaseTemplate('Ticket Resolved',
        `<p>Good news! Ticket #${ticket.id} has been marked as <strong>RESOLVED</strong>.</p><p>${ticket.resolution || ''}</p>`,
        ticketUrl);
      break;
    case 'REPLY':
      if (!ticket) return;
      subject = `Re: [Ticket #${ticket.id}] ${ticket.title}`;
      html = getBaseTemplate('New Reply',
        `<p>Hello ${recipient.name},</p><p>You have a new reply:</p><div class="meta-box"><p style="font-style: italic;">${comment || 'No content'}</p></div>`,
        ticketUrl, 'View Reply');
      break;
    case 'ACKNOWLEDGEMENT':
      if (!ticket) return;
      subject = `We received your ticket #${ticket.id}`;
      html = getBaseTemplate('Ticket Acknowledged',
        `<p>Hello ${recipient.name},</p><p>Thank you for contacting us. We have received your ticket and will respond within SLA.</p><div class="meta-box">
          <div class="meta-item"><span class="meta-label">Ticket:</span> #${ticket.id}</div>
          <div class="meta-item"><span class="meta-label">Subject:</span> ${ticket.title}</div>
        </div>`,
        ticketUrl);
      break;
    case 'SLA_WARNING':
      if (!ticket) return;
      subject = `[URGENT] SLA Warning: Ticket #${ticket.id}`;
      html = getBaseTemplate('SLA Breach Warning',
        `<p style="color: #dc2626; font-weight: 600;">Attention: This ticket is approaching SLA breach.</p><div class="meta-box">
          <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
          <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
        </div>`,
        ticketUrl, 'Resolve Now');
      break;
    case 'FEEDBACK_REQUEST':
      if (!ticket) return;
      subject = `How was your experience with Ticket #${ticket.id}?`;
      html = getBaseTemplate('Feedback Request',
        `<p>Hello ${recipient.name},</p><p>We hope your issue is resolved. Please rate your experience.</p>`,
        `${ticketUrl}/feedback`);
      break;
  }

  await sendEmail({
    to: recipient.email,
    subject,
    html,
    inReplyTo,
    references,
    accountId: emailAccountId
  });
}

export async function getDefaultEmailAccount() {
  return prisma.emailAccount.findFirst({
    where: { isActive: true, isDefault: true }
  });
}
