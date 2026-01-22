import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "adrianodevequi@gmail.com";
const newPassword = "123456";

async function main() {
    console.log(`Setting password for ${email}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log(`Success! Password for ${user.email} set to '${newPassword}'.`);
    } catch (error) {
        console.error("Error setting password:", error);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
