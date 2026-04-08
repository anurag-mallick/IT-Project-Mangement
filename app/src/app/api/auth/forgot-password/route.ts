import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return NextResponse.json(
                { message: 'If an account exists with this email, a reset link has been sent.' },
                { status: 200 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token in database
        await prisma.globalSetting.upsert({
            where: { key: `reset_token_${user.id}` },
            update: { value: JSON.stringify({ token: resetToken, expiry: resetTokenExpiry }) },
            create: { key: `reset_token_${user.id}`, value: JSON.stringify({ token: resetToken, expiry: resetTokenExpiry }) },
        });

        // In a real app, send email here
        // For now, we'll just return success
        console.log(`Password reset token for ${email}: ${resetToken}`);

        return NextResponse.json(
            { message: 'If an account exists with this email, a reset link has been sent.' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}