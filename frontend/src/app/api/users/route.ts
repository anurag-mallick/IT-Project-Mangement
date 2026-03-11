import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

async function getUsersHandler() {
  try {
    // Return all users from the database, regardless of role, 
    // so tickets can be assigned to anyone.
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

async function createUserHandler(req: NextRequest, user: any) {
  try {
    // Basic implementation for the admin panel's New User Modal
    const data = await req.json();
    
    // In a real production app, we would create the user in Supabase Auth first
    // using the service_role key, then insert into Prisma.
    // Here we just insert into Prisma so the user shows up in the database list.
    const newUser = await prisma.user.create({
      data: {
        username: data.username || data.email || 'user',
        name: data.name || '',
        role: data.role || 'STAFF',
        password: data.password || '$2b$10$abcdefghijklmnopqrstuv', // Dummy hash
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
