import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: List all users
export async function GET() {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            include: {
                team: true
            }
        });

        // Sanitize sensitive data
        const sanitizedUsers = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            image: u.image,
            role: u.role,
            teamId: u.teamId,
            teamName: u.team?.name || 'Sem Equipe',
            createdAt: u.createdAt
        }));

        return NextResponse.json(sanitizedUsers);
    } catch (error) {
        console.error("GET /api/admin/users Error:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

// PUT: Update user role or team
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, role, teamId } = body;

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                role,
                teamId: teamId === 'NONE' ? null : teamId // Handle clearing team
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("PUT /api/admin/users Error:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}
