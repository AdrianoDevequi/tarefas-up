import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: List all teams
export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teams = await prisma.team.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { members: true }
                }
            }
        });

        return NextResponse.json(teams);
    } catch (error) {
        console.error("GET /api/admin/teams Error:", error);
        return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
    }
}

// POST: Create a new team
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Team name required" }, { status: 400 });
        }

        const team = await prisma.team.create({
            data: { name }
        });

        return NextResponse.json(team);
    } catch (error) {
        console.error("POST /api/admin/teams Error:", error);
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
}

// DELETE: Delete a team
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "Team ID required" }, { status: 400 });
        }

        await prisma.team.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/admin/teams Error:", error);
        return NextResponse.json({ error: "Failed to delete team" }, { status: 500 });
    }
}
