export const revalidate = 60;
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, SessionUser } from "@/lib/auth";
import bcrypt from 'bcryptjs';

async function getUsersHandler(req: NextRequest, user: SessionUser) {
  try {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
    });
    const isAdmin = dbUser?.role === 'ADMIN';

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        isActive: true,
        ...(isAdmin ? { email: true, role: true, createdAt: true } : {})
      },
      where: isAdmin ? {} : { isActive: true },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

async function createUserHandler(req: NextRequest, user: SessionUser) {
  try {
    // Fix 2: Verify role in DB
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true }
    });
    if (dbUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await req.json();
    
    // Fix 1: Hash password before storing
    const passwordToHash = data.password || 'Welcome@123';
    const hashed = await bcrypt.hash(passwordToHash, 10);

    const newUser = await prisma.user.create({
      data: {
        username: data.username || data.email?.split('@')[0] || 'user',
        email: data.email,
        name: data.name || '',
        role: data.role || 'STAFF',
        password: hashed,
        isActive: true
      }
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error("Create User Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

export const GET = withAuth(getUsersHandler);
export const POST = withAuth(createUserHandler);
