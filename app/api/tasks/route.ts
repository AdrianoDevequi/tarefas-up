import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch tasks based on Role and Team
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { role, teamId, id: userId } = session.user;

        let whereClause: any = { userId }; // Default: Only own tasks

        if (role === 'ADMIN') {
            whereClause = {}; // Admin sees all
        } else if (teamId) {
            // Collaborator with team: Own tasks + Team members' tasks
            whereClause = {
                OR: [
                    { userId },
                    { user: { teamId } }
                ]
            };
        }

        let tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            }
        });

        // Auto-migration for legacy tasks (Single user migration)
        if (tasks.length === 0 && role === 'ADMIN') { // Only run migration if admin/safe? actually logic was for single user. stick to keep it safe.
            // Keeping original logic but wrapped safely or removed if deemed obsolete. 
            // Logic: if 0 tasks found for user, maybe check for nulls?
            // Given RBAC, legacy migration is tricky. 
            // IF context was "single user app becoming multi user", 
            // we might assume old tasks belong to the first user (who is likely admin).
            // Let's keep existing simpler migration if logical, or remove it to avoid side effects.
            // I will COMMENT OUT the legacy migration for now to avoid accidental reassignment in a multi-user context.
        }

        return NextResponse.json(tasks);
    } catch (error) {
        console.error("GET /api/tasks Error:", error);
        return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }
}

// POST: Create a new task
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { title, description, dueDate, status, estimatedTime, assignedUserId } = body;

        // Default to creator
        let targetUserId = session.user.id;

        // If assignment is requested, check if creator is ADMIN
        if (assignedUserId && assignedUserId !== session.user.id) {
            if (session.user.role === 'ADMIN') {
                targetUserId = assignedUserId;
            } else {
                // Ignore assignment attempt if not admin, or return 403? 
                // Silently ignoring is safer/easier for now, or could throw error.
                // Let's stick to default behavior (assign to self) if not allowed.
            }
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                dueDate: new Date(dueDate), // Ensure Date object
                status: status || "TODO",
                estimatedTime,
                userId: targetUserId,
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error("POST /api/tasks Error:", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

// PUT: Update a task (Status only for now, can be expanded)
export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { id, status, title, description, dueDate, estimatedTime } = body;

        // Ensure ownership
        const existing = await prisma.task.findUnique({ where: { id: Number(id) } });
        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const task = await prisma.task.update({
            where: { id: Number(id) },
            data: {
                status,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : undefined,
                estimatedTime
            },
        });

        return NextResponse.json(task);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

// DELETE: Remove a task
export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // Ensure ownership
        const existing = await prisma.task.findUnique({ where: { id: Number(id) } });

        if (!existing || existing.userId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.task.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
