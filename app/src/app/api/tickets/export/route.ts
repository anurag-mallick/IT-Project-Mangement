import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const sessionUser = await getUser();
        if (!sessionUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'csv';
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assignedToId = searchParams.get('assignedToId');

        const where: any = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = parseInt(assignedToId);

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                assignedTo: {
                    select: {
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                comments: {
                    select: {
                        id: true,
                    },
                },
                attachments: {
                    select: {
                        id: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (format === 'csv') {
            const csvRows = [
                ['ID', 'Title', 'Description', 'Status', 'Priority', 'Assigned To', 'Requester', 'Comments', 'Attachments', 'Created At', 'Updated At'].join(','),
                ...tickets.map(ticket => [
                    ticket.id,
                    `"${ticket.title.replace(/"/g, '""')}"`,
                    `"${ticket.description.replace(/"/g, '""')}"`,
                    ticket.status,
                    ticket.priority,
                    ticket.assignedTo?.name || ticket.assignedTo?.username || 'Unassigned',
                    ticket.requesterName || 'N/A',
                    ticket.comments.length,
                    ticket.attachments.length,
                    ticket.createdAt.toISOString(),
                    ticket.updatedAt.toISOString(),
                ].join(','))
            ];

            const csvContent = csvRows.join('\n');

            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="tickets-export-${new Date().toISOString().split('T')[0]}.csv"`,
                },
            });
        }

        // JSON format
        return NextResponse.json({
            exportedAt: new Date().toISOString(),
            count: tickets.length,
            tickets: tickets.map(ticket => ({
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
                assignedTo: ticket.assignedTo?.name || ticket.assignedTo?.username || 'Unassigned',
                requesterName: ticket.requesterName,
                commentsCount: ticket.comments.length,
                attachmentsCount: ticket.attachments.length,
                createdAt: ticket.createdAt,
                updatedAt: ticket.updatedAt,
            })),
        });
    } catch (error) {
        console.error('Export tickets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}