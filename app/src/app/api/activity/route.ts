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
        const limit = parseInt(searchParams.get('limit') || '20');
        const ticketId = searchParams.get('ticketId');

        const where: any = {};
        if (ticketId) {
            where.ticketId = parseInt(ticketId);
        }

        const activities = await prisma.activityLog.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                    },
                },
                ticket: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
            },
        });

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Get activity error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}