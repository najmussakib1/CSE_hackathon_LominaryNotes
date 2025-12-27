import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;

    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname);
    const isApiRoute = nextUrl.pathname.startsWith("/api");

    if (isApiAuthRoute) return;

    if (isPublicRoute) {
        // If it's the home page, don't redirect authenticated users away
        if (nextUrl.pathname === "/") return;

        // Redirect logged in users away from login/register
        if (isLoggedIn) {
            return Response.redirect(new URL("/", nextUrl));
        }
        return;
    }

    if (!isLoggedIn && !isApiRoute) {
        return Response.redirect(new URL("/login", nextUrl));
    }

    return;
});

export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
