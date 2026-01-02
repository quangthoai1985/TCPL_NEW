import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"
import { z } from "zod"

// NOTE: In middleware, we cannot use Prisma Client directly because it's not Edge compatible yet (unless using Edge accelerator).
// So we separate the config. The actual DB logic for 'authorize' might need refactoring if we want full edge compatibility,
// but for standard Node runtime middleware in Next.js, this split is still good practice.
// For now, to avoid Prisma in middleware, we simplify this or use a separate strategy.

// However, for this migration, we will keep the 'auth.ts' as the main entry point 
// and just export a basic config here if needed, OR we just use the main auth.ts 
// if we are not deploying to Vercel Edge.
// Since we are checking for 'req.auth', we need the strategy.

// Let's create a simplified config for robust usage.

export default {
    providers: [
        Credentials({
            async authorize(credentials) {
                return null; // Logic is in auth.ts
            }
        })
    ],
    pages: {
        signIn: "/login-page-content",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') ||
                nextUrl.pathname.startsWith('/admin') ||
                nextUrl.pathname.startsWith('/commune');
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }
            return true;
        },
    },
} satisfies NextAuthConfig
