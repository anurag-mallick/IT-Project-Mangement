import nodemailer from 'nodemailer';
import { Ticket } from '@/types';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  return transporter;
}

function getBaseTemplate(title: string, content: string, actionUrl?: string, actionLabel?: string) {
  const primaryColor = '#2563eb';
  const bgColor = '#f8fafc';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; background-color: ${bgColor}; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
          .header { background: ${primaryColor}; padding: 32px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
          .content { padding: 32px; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
          .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .meta-item { display: flex; margin-bottom: 8px; font-size: 14px; }
          .meta-label { font-weight: 600; width: 100px; color: #64748b; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; border: 1px solid currentColor; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>${title}</h1></div>
          <div class="content">
            ${content}
            ${actionUrl ? `<div style="text-align: center;"><a href="${actionUrl}" class="button">${actionLabel || 'View Details'}</a></div>` : ''}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Horizon IT Management Suite. All rights reserved.<br/>
            This is an automated notification. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendTicketEmail({
  type,
  ticket,
  recipient,
  password,
  comment,
}: {
  type: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RESOLVED' | 'USER_CREATED' | 'NEW_COMMENT' | 'SLA_WARNING';
  ticket?: Ticket;
  recipient: { email: string; name: string };
  password?: string;
  comment?: string;
}) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('SMTP settings not configured. Skipping email notification.');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ticketUrl = ticket ? `${appUrl}/tickets/${ticket.id}` : appUrl;
  let subject = '';
  let html = '';

  switch (type) {
    case 'USER_CREATED':
      subject = `Welcome to Horizon IT Management Suite`;
      html = getBaseTemplate(
        'Account Created',
        `<p>Hello ${recipient.name},</p>
         <p>Your account has been successfully set up. You can now access the IT Management Suite using the credentials below:</p>
         <div class="meta-box">
           <div class="meta-item"><span class="meta-label">Email:</span> ${recipient.email}</div>
           <div class="meta-item"><span class="meta-label">Password:</span> <code>${password || 'Welcome@123'}</code></div>
         </div>
         <p>For security reasons, please update your password after your first login.</p>`,
        appUrl,
        'Login to Dashboard'
      );
      break;

    case 'CREATED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] New Ticket: ${ticket.title}`;
      html = getBaseTemplate(
        'New Ticket Created',
        `<p>A new ticket has been generated in the system:</p>
         <div class="meta-box">
           <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
           <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
           <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
           <div class="meta-item"><span class="meta-label">Status:</span> ${ticket.status}</div>
         </div>`,
        ticketUrl
      );
      break;

    case 'ASSIGNED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] Assigned to You: ${ticket.title}`;
      html = getBaseTemplate(
        'Ticket Assigned',
        `<p>Hello ${recipient.name}, you have been assigned to the following ticket:</p>
         <div class="meta-box">
           <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
           <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
           <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
         </div>`,
        ticketUrl
      );
      break;

    case 'RESOLVED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] Ticket Resolved: ${ticket.title}`;
      html = getBaseTemplate(
        'Ticket Resolved',
        `<p>Good news! Ticket #${ticket.id} has been marked as <strong>RESOLVED</strong>.</p>
         <div class="meta-box">
           <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
         </div>`,
        ticketUrl
      );
      break;

    case 'UPDATED':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] status update: ${ticket.title}`;
      html = getBaseTemplate(
        'Ticket Update',
        `<p>Ticket #${ticket.id} has been updated to <strong>${ticket.status}</strong>.</p>`,
        ticketUrl
      );
      break;

    case 'NEW_COMMENT':
      if (!ticket) return;
      subject = `[Ticket #${ticket.id}] New Comment: ${ticket.title}`;
      html = getBaseTemplate(
        'New Comment',
        `<p>A new comment has been added to ticket #${ticket.id}:</p>
         <div class="meta-box">
           <p style="font-style: italic; color: #475569;">"${comment || 'No content'}"</p>
         </div>`,
        ticketUrl
      );
      break;

    case 'SLA_WARNING':
      if (!ticket) return;
      subject = `[URGENT] SLA Warning: Ticket #${ticket.id}`;
      html = getBaseTemplate(
        'SLA Breach Warning',
        `<p style="color: #dc2626; font-weight: 600;">Attention: This ticket is approaching its SLA breach time.</p>
         <div class="meta-box">
           <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
           <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
           <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
         </div>`,
        ticketUrl,
        'Resolve Now'
      );
      break;
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || '"IT Support" <support@yourdomain.com>',
      to: recipient.email,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);
  } catch (err) {
    console.error('Error sending email via SMTP:', err);
    throw err;
  }
}
