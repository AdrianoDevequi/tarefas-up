import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET: Fetch tasks based on Role and Team
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { role, teamId, id: userId } = session.user;

        // Parse query params for filtering
        const url = new URL(req.url);
        const filter = url.searchParams.get("filter"); // 'me' | 'team'

        let whereClause: any = {};

        if (filter === 'me') {
            // "My Tasks": Only tasks assigned to me or created by me (if distinct?) 
            // Usually "My Tasks" = tasks assigned to the user.
            whereClause = { userId };
        } else if (filter === 'team') {
            // "Team Tasks": All tasks belonging to the user's team, EXCEPT their own?
            // Or ALL team tasks including theirs? 
            // Request says: "team tasks ... appear separately from collaborator tasks"
            // Typically "Team Board" shows everyone's tasks. "My Tasks" shows mine.

            if (role === 'ADMIN') {
                // Admin sees ALL tasks from ALL teams
                whereClause = {};
            } else if (teamId) {
                whereClause = {
                    user: { teamId: teamId }
                };
            } else {
                // No team? Empty list for team view
                return NextResponse.json([]);
            }
        } else {
            // Default/Fallback Logic (Backwards compatibility)
            if (role === 'ADMIN') {
                whereClause = {};
            } else if (teamId) {
                whereClause = {
                    OR: [
                        { userId },
                        { user: { teamId } }
                    ]
                };
            } else {
                whereClause = { userId };
            }
        }

        let tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        // Include Team info for grouping
                        team: {
                            select: { id: true, name: true }
                        }
                    }
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

        // Ensure ownership OR Admin
        const existing = await prisma.task.findUnique({ where: { id: Number(id) } });
        if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

        const isAdmin = session.user.role === 'ADMIN';
        if (existing.userId !== session.user.id && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Prepare update data
        const updateData: any = {
            status,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            estimatedTime
        };

        // Allow Admin to reassign task
        // Note: The frontend sends 'assignedUserId', but Prisma expects 'userId'
        // We only allow this change if the user is an ADMIN
        if (isAdmin && (body.assignedUserId || body.userId)) {
            // Prefer assignedUserId from frontend, fallback to userId if direct API usage
            const newOwnerId = body.assignedUserId || body.userId;
            if (newOwnerId && newOwnerId !== existing.userId) {
                updateData.userId = newOwnerId;
            }
        }

        const task = await prisma.task.update({
            where: { id: Number(id) },
            data: updateData,
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
