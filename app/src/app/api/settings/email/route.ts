import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

export const GET = withAuth(async (req, user) => {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const keys = [
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM',
    'IMAP_HOST', 'IMAP_PORT', 'IMAP_USER', 'IMAP_PASS', 'IMAP_TICKET_FOLDER', 'IMAP_SECURE'
  ];

  const settings = await prisma.globalSetting.findMany({
    where: {
      key: { in: keys }
    }
  });

  const settingsMap = settings.reduce((acc: Record<string, string>, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  return NextResponse.json(settingsMap);
});

export const POST = withAuth(async (req, user) => {
  if (user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const data = await req.json();

  if (action === 'test') {
    try {
      const testTransporter = nodemailer.createTransport({
        host: data.SMTP_HOST,
        port: parseInt(data.SMTP_PORT || '587'),
        secure: data.SMTP_SECURE === 'true',
        auth: {
          user: data.SMTP_USER,
          pass: data.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      await testTransporter.verify();
      return NextResponse.json({ success: true, message: 'SMTP connection verified successfully!' });
    } catch (error: any) {
      console.error('SMTP Verification Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to verify SMTP connection. Please check your credentials and server details.' 
      }, { status: 400 });
    }
  }

  if (action === 'test-imap') {
    const client = new ImapFlow({
      host: data.IMAP_HOST,
      port: parseInt(data.IMAP_PORT || '993'),
      secure: data.IMAP_SECURE === 'true',
      auth: {
        user: data.IMAP_USER,
        pass: data.IMAP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    try {
      await client.connect();
      await client.logout();
      return NextResponse.json({ success: true, message: 'IMAP connection verified successfully!' });
    } catch (error: any) {
      console.error('IMAP Verification Error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to verify IMAP connection. Please check your credentials and server details.' 
      }, { status: 400 });
    }
  }

  const updates = Object.entries(data).map(([key, value]) => {
    return prisma.globalSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  });

  await Promise.all(updates);

  return NextResponse.json({ success: true });
});
