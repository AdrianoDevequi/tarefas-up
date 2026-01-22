import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { name: true, email: true }
    });

    if (admins.length === 0) {
        console.log("No ADMIN users found.");
        console.log("Registered Users:");
        const users = await prisma.user.findMany({ take: 10, select: { name: true, email: true } });
        users.forEach(u => console.log(`- ${u.name} (${u.email})`));
    } else {
        console.log("Admin Users:");
        admins.forEach(admin => {
            console.log(`- ${admin.name} (${admin.email})`);
        });
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
