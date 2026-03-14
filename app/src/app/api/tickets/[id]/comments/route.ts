import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const POST = withAuth(async (req: NextRequest, user: any, { params }: { params: { id: string } }) => {
  try {
    const ticketId = parseInt(params.id);
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
         author: { select: { name: true, username: true } },
         ticket: { select: { title: true } }
      }
    });

    // 2. Parse @mentions
    // Look for @username
    const mentionRegex = /@([a-zA-Z0-9_\-\.]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    const mentionedUsernames = matches.map(m => m[1]);

    if (mentionedUsernames.length > 0) {
      // Find the associated users
      const mentionedUsers = await prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames }
        },
        select: { email: true, name: true, username: true }
      });

      // 3. Send Emails via Resend
      if (process.env.RESEND_API_KEY && resend && mentionedUsers.length > 0) {
         try {
             // Send an email to each mentioned user
             const emailPromises = mentionedUsers.map(mentionedUser => {
                 return resend.emails.send({
                    from: 'Horizon IT <notifications@onboarding.resend.dev>', // Use a verified domain in production
                    to: [mentionedUser.email],
                    subject: `You were mentioned in Ticket #${ticketId}`,
                    html: `
                        <h2>You were mentioned by ${user.name || user.username}</h2>
                        <p><strong>Ticket:</strong> ${comment.ticket?.title} (#${ticketId})</p>
                        <hr />
                        <p><strong>Comment:</strong></p>
                        <p>${content}</p>
                        <br />
                        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/?ticketId=${ticketId}">View Ticket</a></p>
                    `
                 });
             });
             
             await Promise.allSettled(emailPromises);
         } catch (emailError) {
             console.error("Failed to send mention emails:", emailError);
             // Don't fail the comment creation if email fails
         }
      }
    }

    return NextResponse.json(comment, { status: 201 });

  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
