import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

// API to update mirror password in public."User" table
// This ensures that the custom DB mirror stays in sync with Supabase Auth
async function updatePasswordHandler(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // In a real app, you'd use bcrypt or similar, 
    // but the system seems to use SQL crypt() during setup.
    // For simplicity with the current Prisma setup, we'll execute raw SQL
    // to ensure the gen_salt and crypt functions are used correctly.
    
    await prisma.$executeRawUnsafe(
      `UPDATE public."User" SET password = crypt($1, gen_salt('bf')) WHERE username = $2`,
      password,
      email
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update Password Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update mirror password" }, { status: 500 });
  }
}

export const POST = withAuth(updatePasswordHandler);
