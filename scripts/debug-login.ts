import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "adrianodevequi@gmail.com";
const password = "123456";

async function main() {
    console.log(`Testing login for ${email}...`);

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log("User NOT FOUND in database.");
            return;
        }

        console.log("User found:", user.email);
        console.log("Role:", user.role);
        console.log("Has password hash?", !!user.password);

        if (!user.password) {
            console.log("User has NO password set.");
            return;
        }

        const isValid = await bcrypt.compare(password, user.password);
        console.log(`Password '123456' valid? ${isValid}`);

        if (!isValid) {
            console.log("Hash mismatch. Resetting password...");
            // Fallback: Force reset again just in case
            const newHash = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: { password: newHash }
            });
            console.log("Password reset confirmed.");
        }

    } catch (error) {
        console.error("Error during debug:", error);
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
