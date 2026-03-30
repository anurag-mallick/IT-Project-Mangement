import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from './prisma';

export async function pollEmails() {
  const client = new ImapFlow({
    host: process.env.IMAP_HOST || '',
    port: parseInt(process.env.IMAP_PORT || '993'),
    secure: true,
    auth: {
      user: process.env.IMAP_USER || '',
      pass: process.env.IMAP_PASS || '',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    // Select the folder to poll
    const mailbox = await client.mailboxOpen(process.env.IMAP_TICKET_FOLDER || 'INBOX');
    console.log('Opened mailbox:', mailbox.path);

    // Search for unread messages
    for await (const message of client.fetch({ seen: false }, { source: true })) {
      if (!message.source) continue;
      
      const parsed: any = await simpleParser(message.source);
      
      const title = parsed.subject || 'No Subject';
      const description = parsed.text || parsed.html || 'No Content';
      const requesterEmail = parsed.from?.value[0]?.address || 'anonymous@example.com';
      const requesterName = parsed.from?.value[0]?.name || requesterEmail;

      console.log(`Creating ticket from email: ${title} (${requesterEmail})`);

      try {
        await prisma.ticket.create({
          data: {
            title: `[Email] ${title}`,
            description: `Received via email from ${requesterEmail}:\n\n${description}`,
            requesterName,
            status: 'TODO',
            priority: 'P2', // Default priority for emails
          },
        });

        // Mark as seen so we don't process it again
        await client.messageFlagsAdd(message.uid, ['\\Seen']);
      } catch (err) {
        console.error('Failed to create ticket from email:', err);
      }
    }

    await client.logout();
  } catch (err) {
    console.error('IMAP Error:', err);
  }
}
