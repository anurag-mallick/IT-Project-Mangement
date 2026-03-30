import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from './prisma';

export async function pollEmails() {
  const keys = ['IMAP_HOST', 'IMAP_PORT', 'IMAP_USER', 'IMAP_PASS', 'IMAP_TICKET_FOLDER', 'IMAP_SECURE'];
  const settings = await prisma.globalSetting.findMany({
    where: { key: { in: keys } }
  });
  
  const settingsMap = settings.reduce((acc: Record<string, string>, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  const config = {
    host: settingsMap.IMAP_HOST || process.env.IMAP_HOST || '',
    port: parseInt(settingsMap.IMAP_PORT || process.env.IMAP_PORT || '993'),
    user: settingsMap.IMAP_USER || process.env.IMAP_USER || '',
    pass: settingsMap.IMAP_PASS || process.env.IMAP_PASS || '',
    folder: settingsMap.IMAP_TICKET_FOLDER || process.env.IMAP_TICKET_FOLDER || 'INBOX',
    secure: settingsMap.IMAP_SECURE === 'true',
  };

  if (!config.host || !config.user) {
    console.warn('IMAP settings not configured. Skipping email polling.');
    return;
  }

  const client = new ImapFlow({
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

  try {
    await client.connect();

    // Select the folder to poll
    const mailbox = await client.mailboxOpen(config.folder);
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
