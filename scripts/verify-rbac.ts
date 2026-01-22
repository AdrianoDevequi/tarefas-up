import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Verification...");

    // Clean up previous test data
    await prisma.task.deleteMany({ where: { title: { startsWith: '[TEST]' } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
    await prisma.team.deleteMany({ where: { name: '[TEST] Team' } });

    // 1. Create Team
    const team = await prisma.team.create({
        data: { name: '[TEST] Team' }
    });
    console.log("Created Team:", team.id);

    // 2. Create Users
    const admin = await prisma.user.create({
        data: {
            email: 'admin@test.com',
            role: 'ADMIN',
            name: 'Admin User'
        }
    });

    const collab1 = await prisma.user.create({
        data: {
            email: 'collab1@test.com',
            role: 'COLLABORATOR',
            teamId: team.id,
            name: 'Collab 1'
        }
    });

    const collab2 = await prisma.user.create({
        data: {
            email: 'collab2@test.com',
            role: 'COLLABORATOR',
            teamId: team.id,
            name: 'Collab 2'
        }
    });

    const outsider = await prisma.user.create({
        data: {
            email: 'outsider@test.com',
            role: 'COLLABORATOR',
            name: 'Outsider'
        }
    });

    console.log("Created Users:", { admin: admin.id, collab1: collab1.id, collab2: collab2.id, outsider: outsider.id });

    // 3. Create Tasks
    await prisma.task.create({ data: { title: '[TEST] Task for Collab 1', userId: collab1.id, dueDate: new Date(), status: 'TODO' } });
    await prisma.task.create({ data: { title: '[TEST] Task for Collab 2', userId: collab2.id, dueDate: new Date(), status: 'TODO' } });
    await prisma.task.create({ data: { title: '[TEST] Task for Outsider', userId: outsider.id, dueDate: new Date(), status: 'TODO' } });

    console.log("Created Tasks");

    // 4. Simulate Queries (mimicking the API logic)

    // Helper to get tasks
    async function getTasksForUser(user: any) {
        let whereClause: any = { userId: user.id };
        if (user.role === 'ADMIN') {
            whereClause = {};
        } else if (user.teamId) {
            whereClause = {
                OR: [
                    { userId: user.id },
                    { user: { teamId: user.teamId } }
                ]
            };
        }
        return prisma.task.findMany({ where: whereClause });
    }

    const tasksForAdmin = await getTasksForUser(admin);
    console.log(`Admin sees ${tasksForAdmin.length} tasks (Expected 3)`);

    const tasksForCollab1 = await getTasksForUser(collab1);
    console.log(`Collab1 sees ${tasksForCollab1.length} tasks (Expected 2: Own + Collab2)`);

    const tasksForOutsider = await getTasksForUser(outsider);
    console.log(`Outsider sees ${tasksForOutsider.length} tasks (Expected 1: Own only)`);

    // Cleanup
    // await prisma.task.deleteMany({ where: { title: { startsWith: '[TEST]' } } });
    // await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
    // await prisma.team.deleteMany({ where: { name: '[TEST] Team' } });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
