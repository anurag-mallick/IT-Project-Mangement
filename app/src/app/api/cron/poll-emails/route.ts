import { NextResponse } from 'next/server';
import { pollEmails } from '@/lib/imap';

/**
 * GET /api/cron/poll-emails
 * Triggered by a cron job to poll configured IMAP mailboxes for new tickets.
 * 
 * Security: Requires 'Authorization: Bearer <CRON_SECRET>' or 
 * 'X-Cron-Secret: <CRON_SECRET>' header.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecretHeader = request.headers.get('x-cron-secret');
  
  const expectedSecret = process.env.CRON_SECRET;

  // Basic security check
  if (expectedSecret) {
    const providedSecret = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : cronSecretHeader;

    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('CRON_SECRET is not set. API is currently unprotected.');
  }

  try {
    console.log('Starting automated email polling...');
    // pollEmails already handles the settings fetching and internal logging
    await pollEmails();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email polling completed successfully.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Cron Polling Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
