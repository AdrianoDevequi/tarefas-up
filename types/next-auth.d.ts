import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: Role;
            teamId: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        role: Role;
        teamId: string | null;
    }
}

declare module "@auth/core/adapters" {
    interface AdapterUser {
        role: Role;
        teamId: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: Role;
        teamId: string | null;
    }
}
