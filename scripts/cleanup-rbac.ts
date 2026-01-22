import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up test data...");
    await prisma.task.deleteMany({ where: { title: { startsWith: '[TEST]' } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: '@test.com' } } });
    await prisma.team.deleteMany({ where: { name: '[TEST] Team' } });
    console.log("Cleanup complete.");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
