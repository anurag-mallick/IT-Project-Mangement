import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Find the reset token in global settings by querying all and matching
        const allResetSettings = await prisma.globalSetting.findMany({
            where: {
                key: { startsWith: 'reset_token_' },
            },
        });

        // Find the specific record that matches the token
        let resetSetting = null;
        for (const setting of allResetSettings) {
            try {
                const { token: storedToken, expiry } = JSON.parse(setting.value);
                if (storedToken === token) {
                    if (new Date() > new Date(expiry)) {
                        // Clean up expired token
                        await prisma.globalSetting.delete({ where: { key: setting.key } });
                        return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
                    }
                    resetSetting = setting;
                    break;
                }
            } catch {
                continue;
            }
        }

        if (!resetSetting) {
            return NextResponse.json(
                { error: 'Invalid or expired reset token' },
                { status: 400 }
            );
        }

        const userId = parseInt(resetSetting.key.replace('reset_token_', ''));
        if (isNaN(userId)) {
            return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Clean up used token
        await prisma.globalSetting.delete({
            where: { key: resetSetting.key },
        });

        return NextResponse.json(
            { message: 'Password has been reset successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}