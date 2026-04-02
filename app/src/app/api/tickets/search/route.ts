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
        const query = searchParams.get('q') || '';
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const assignedToId = searchParams.get('assignedToId');
        const folderId = searchParams.get('folderId');
        const tags = searchParams.get('tags');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: any = {};

        // Text search across title and description
        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }

        // Filters
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedToId) where.assignedToId = parseInt(assignedToId);
        if (folderId) where.folderId = parseInt(folderId);

        // Tags filter
        if (tags) {
            const tagArray = tags.split(',').map(t => t.trim());
            where.tags = { hasSome: tagArray };
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        // Validate sort fields
        const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'status', 'dueDate'];
        const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

        const [tickets, total] = await Promise.all([
            prisma.ticket.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [orderByField]: orderByDirection },
                include: {
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            email: true,
                        },
                    },
                    folder: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                    comments: {
                        select: { id: true },
                    },
                    attachments: {
                        select: { id: true },
                    },
                },
            }),
            prisma.ticket.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            tickets,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            filters: {
                query,
                status,
                priority,
                assignedToId,
                folderId,
                tags,
                dateFrom,
                dateTo,
                sortBy: orderByField,
                sortOrder: orderByDirection,
            },
        });
    } catch (error) {
        console.error('Search tickets error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}