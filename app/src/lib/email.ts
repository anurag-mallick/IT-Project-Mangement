import nodemailer from 'nodemailer';
import { prisma } from './prisma';

async function getEmailConfig() {
  const keys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const settings = await prisma.globalSetting.findMany({
    where: {
      key: { in: keys }
    }
  });

  const config = settings.reduce((acc: Record<string, string>, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return {
    host: config.SMTP_HOST || process.env.SMTP_HOST,
    port: parseInt(config.SMTP_PORT || process.env.SMTP_PORT || '587'),
    secure: (config.SMTP_SECURE || process.env.SMTP_SECURE) === 'true',
    user: config.SMTP_USER || process.env.SMTP_USER,
    pass: config.SMTP_PASS || process.env.SMTP_PASS,
    from: config.SMTP_FROM || process.env.SMTP_FROM || `"Horizon IT" <${config.SMTP_USER || process.env.SMTP_USER}>`,
  };
}

export async function getTransporter() {
  const config = await getEmailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
            &copy; ${new Date().getFullYear()} Horizon IT Management. All rights reserved.<br/>
            This is an automated notification. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(options: { to: string; subject: string; html: string }): Promise<void> {
  try {
    const config = await getEmailConfig();
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Error sending email:', error);
    // Fires and forgets, logs but doesn't throw
  }
}

export async function sendSLABreachEmail(ticket: { id: string | number; title: string; priority: string }, assigneeEmail: string): Promise<void> {
  const subject = `[URGENT] SLA Breach: Ticket #${ticket.id} - ${ticket.title}`;
  const html = getBaseTemplate(
    'SLA Breach Warning',
    `<p style="color: #dc2626; font-weight: 600;">Attention: This ticket has breached its SLA threshold.</p>
     <div class="meta-box">
       <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
       <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
       <div class="meta-item"><span class="meta-label">Priority:</span> ${ticket.priority}</div>
     </div>`,
    `${appUrl}/tickets/${ticket.id}`,
    'View Overdue Ticket'
  );

  await sendEmail({ to: assigneeEmail, subject, html });
}

export async function sendTicketAssignedEmail(ticket: { id: string | number; title: string }, assigneeEmail: string): Promise<void> {
  const subject = `[Ticket #${ticket.id}] Assigned to You: ${ticket.title}`;
  const html = getBaseTemplate(
    'Ticket Assigned',
    `<p>You have been assigned to the following ticket:</p>
     <div class="meta-box">
       <div class="meta-item"><span class="meta-label">ID:</span> #${ticket.id}</div>
       <div class="meta-item"><span class="meta-label">Title:</span> ${ticket.title}</div>
     </div>`,
    `${appUrl}/tickets/${ticket.id}`,
    'View Ticket'
  );

  await sendEmail({ to: assigneeEmail, subject, html });
}

// Keep a wrapper for compatibility with existing code if needed
export type TicketEmailType = 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RESOLVED' | 'USER_CREATED' | 'NEW_COMMENT' | 'SLA_WARNING';
export async function sendTicketEmail({ type, ticket, recipient, password, comment }: any) {
  // Map back to the new helper functions if possible, or just call sendEmail with custom logic
  if (type === 'ASSIGNED' && ticket) {
    return sendTicketAssignedEmail({ id: ticket.id, title: ticket.title }, recipient.email);
  }
  if (type === 'SLA_WARNING' && ticket) {
    return sendSLABreachEmail({ id: ticket.id, title: ticket.title, priority: ticket.priority }, recipient.email);
  }

  // Fallback for others if needed, using the local repo's logic patterns
  // (Assuming we'll migrate other types later or as needed)
}
