import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, SessionUser } from '@/lib/auth';
import { sendTicketEmail } from '@/lib/email';

export const GET = withAuth(async (req: NextRequest, _user: SessionUser, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: SessionUser, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params;
    const ticketId = parseInt(id);
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'Invalid ticket ID' }, { status: 400 });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // 1. Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        ticketId,
        authorId: user.id,
        authorName: user.name || user.username,
      },
      include: {
         author: { select: { id: true, name: true, username: true } },
         ticket: { select: { title: true } }
      }
    });

    // Log the comment addition
    const dbUser = await prisma.user.findUnique({ where: { email: user.email } });

    const truncatedContent = content.length > 80 ? content.substring(0, 80) + '...' : content;
    
    await prisma.activityLog.create({
      data: {
        ticketId,
        userId: dbUser?.id,
        action: 'COMMENT_ADDED',
        newValue: truncatedContent
      }
    });

    // 3. Send Notifications
    const notificationPromises = [];

    // Notify ticket assignee about new comment
    const ticketWithAssignee = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignedTo: { select: { id: true, name: true, username: true, email: true } } }
    });

    if (ticketWithAssignee) {
      const assigneeEmail = ticketWithAssignee.assignedTo?.email || ticketWithAssignee.assignedTo?.username;
      if (assigneeEmail && ticketWithAssignee.assignedTo?.id !== user.id) {
         notificationPromises.push(
           sendTicketEmail({
             type: 'NEW_COMMENT',
             ticket: { id: ticketId, title: ticketWithAssignee.title } as any,
             recipient: { email: assigneeEmail, name: ticketWithAssignee.assignedTo?.name || 'Assignee' },
             comment: content
           })
         );
      }

      // Parse @mentions
      const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
      const matches = [...content.matchAll(mentionRegex)];
      const mentionedUsernames = matches.map(m => m[1]);

      if (mentionedUsernames.length > 0) {
        const mentionedUsers = await prisma.user.findMany({
          where: { username: { in: mentionedUsernames } },
          select: { id: true, name: true, username: true, email: true }
        });

        for (const mUser of mentionedUsers) {
          const mEmail = mUser.email || mUser.username;
          if (mEmail && mEmail !== assigneeEmail && mUser.username !== user.username) {
            notificationPromises.push(
              sendTicketEmail({
                type: 'NEW_COMMENT',
                ticket: { id: ticketId, title: ticketWithAssignee.title } as any,
                recipient: { email: mEmail, name: mUser.name || 'User' },
                comment: content
              })
            );
          }
        }
      }
    }

    if (notificationPromises.length > 0) {
      Promise.allSettled(notificationPromises);
    }

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
