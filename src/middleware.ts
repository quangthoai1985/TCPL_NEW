import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const needsAuth = req.nextUrl.pathname.startsWith("/admin") ||
        req.nextUrl.pathname.startsWith("/commune") ||
        req.nextUrl.pathname.startsWith("/dashboard");

    if (!req.auth && needsAuth) {
        const newUrl = new URL("/login-page-content", req.nextUrl.origin)
        return Response.redirect(newUrl)
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
