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

// POST: Create a new user
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, password, role, teamId } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check availability
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 });
        }

        const bcrypt = require('bcryptjs'); // Import locally to avoid top-level issues if any
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'COLLABORATOR',
                teamId: teamId === 'NONE' ? null : teamId
            },
            include: {
                team: true
            }
        });

        const sanitizedUser = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            teamId: newUser.teamId,
            teamName: newUser.team?.name || 'Sem Equipe',
            createdAt: newUser.createdAt
        };

        return NextResponse.json(sanitizedUser);

    } catch (error) {
        console.error("POST /api/admin/users Error:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
