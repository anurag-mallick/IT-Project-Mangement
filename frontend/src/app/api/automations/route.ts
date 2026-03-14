export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";

export const GET = withAuth(async (req: NextRequest, user: any) => {
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const automations = await prisma.automation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(automations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch automations" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: NextRequest, user: any) => {
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { name, trigger, condition, action } = await req.json();

    const automation = await prisma.automation.create({
      data: {
        name,
        trigger,
        condition,
        action,
      },
    });

    return NextResponse.json(automation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create automation" }, { status: 500 });
  }
});

