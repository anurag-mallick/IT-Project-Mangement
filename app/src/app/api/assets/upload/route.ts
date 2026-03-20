import { NextRequest, NextResponse } from 'next/server';
import { withAuth, SessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadAttachment } from '@/lib/storage';

export const POST = withAuth(async (req: NextRequest, user: SessionUser) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const ticketIdStr = formData.get('ticketId') as string;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!ticketIdStr) return NextResponse.json({ error: 'No ticketId provided' }, { status: 400 });

    const ticketId = parseInt(ticketIdStr);
    if (isNaN(ticketId)) return NextResponse.json({ error: 'Invalid ticketId' }, { status: 400 });

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = [
      'image/png', 
      'image/jpeg', 
      'image/gif', 
      'application/pdf', 
      'text/plain', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10MB limit' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Fetch DB user to get the Int ID for Prisma
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Use the generic upload function from our storage library
    const storageResult = await uploadAttachment(ticketId, file);
    const publicUrl = storageResult.path; // Or a real URL if storage is enabled
    const storagePath = `tickets/${ticketId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;


    // Save the public URL as filePath in the Attachment DB record
    const attachment = await prisma.attachment.create({
      data: {
        fileName: file.name,
        filePath: publicUrl,
        fileSize: file.size,
        mimeType: file.type,
        ticketId: ticketId,
        authorId: dbUser.id
      }
    });

    return NextResponse.json({
      path: storagePath, // We keep the storage path for reference if needed
      name: attachment.fileName,
      size: attachment.fileSize,
      type: attachment.mimeType,
      id: attachment.id,
      publicUrl: publicUrl
    });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
});
