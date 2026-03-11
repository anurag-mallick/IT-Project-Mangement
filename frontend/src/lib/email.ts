import { Resend } from 'resend';
import { Ticket, User } from '@/types';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendTicketEmail({
  type,
  ticket,
  recipient,
}: {
  type: 'CREATED' | 'UPDATED' | 'ASSIGNED' | 'RESOLVED';
  ticket: Ticket;
  recipient: { email: string; name: string };
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set. Skipping email notification.');
    return;
  }

  let subject = '';
  let html = '';

  switch (type) {
    case 'CREATED':
      subject = `[Ticket #${ticket.id}] New Ticket Created: ${ticket.title}`;
      html = `<p>Hi ${recipient.name},</p>
              <p>A new ticket has been created:</p>
              <h3>${ticket.title}</h3>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
              <p><strong>Status:</strong> ${ticket.status}</p>
              <hr/>
              <p>You can view it in the IT Management Dashboard.</p>`;
      break;
    case 'ASSIGNED':
      subject = `[Ticket #${ticket.id}] Ticket Assigned to You: ${ticket.title}`;
      html = `<p>Hi ${recipient.name},</p>
              <p>You have been assigned to ticket #${ticket.id}:</p>
              <h3>${ticket.title}</h3>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
              <hr/>
              <p>Please review it in the IT Management Dashboard.</p>`;
      break;
    case 'UPDATED':
      subject = `[Ticket #${ticket.id}] Ticket Updated: ${ticket.title}`;
      html = `<p>Hi ${recipient.name},</p>
              <p>There is an update on ticket #${ticket.id}:</p>
              <h3>${ticket.title}</h3>
              <p><strong>Status:</strong> ${ticket.status}</p>
              <hr/>
              <p>View the details in the IT Management Dashboard.</p>`;
      break;
    case 'RESOLVED':
      subject = `[Ticket #${ticket.id}] Ticket Resolved: ${ticket.title}`;
      html = `<p>Hi ${recipient.name},</p>
              <p>Ticket #${ticket.id} has been marked as RESOLVED.</p>
              <h3>${ticket.title}</h3>
              <hr/>
              <p>Thank you for using the IT Management system.</p>`;
      break;
  }

  try {
    if (!resend) return;
    const { data, error } = await resend.emails.send({
      from: 'IT Support <onboarding@resend.dev>',
      to: recipient.email,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send email:', error);
    } else {
      console.log('Email sent successfully:', data);
    }
  } catch (err) {
    console.error('Error sending email via Resend:', err);
  }
}
