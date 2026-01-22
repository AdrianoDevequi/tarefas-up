import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = "adrianodevequi@gmail.com";

async function main() {
    console.log(`Promoting user ${email} to ADMIN...`);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: { role: 'ADMIN' },
            create: {
                email,
                name: 'Adriano Admin',
                role: 'ADMIN'
            }
        });
        console.log(`Success! User ${user.name} (${user.email}) is now an ADMIN.`);
    } catch (error) {
        console.error("Error promoting user:", error);
        // Check if user exists first to give better error
        const exists = await prisma.user.findUnique({ where: { email } });
        if (!exists) {
            console.log(`User with email ${email} not found. Please log in first.`);
        }
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
