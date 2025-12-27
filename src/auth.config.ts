import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            return session;
        },
        authorized({ auth }) {
            const isLoggedIn = !!auth?.user;
            return isLoggedIn;
        },
    },
    providers: [], // Providers with database adapters are added in auth.ts
} satisfies NextAuthConfig;
