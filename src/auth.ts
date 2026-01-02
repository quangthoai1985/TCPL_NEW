
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "./auth.config"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

async function getUser(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        })
        return user
    } catch (error) {
        console.error("Failed to fetch user:", error)
        throw new Error("Failed to fetch user.")
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(6) })
                    .safeParse(credentials)

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data
                    const user = await getUser(username)
                    if (!user) return null

                    if (password === user.password) {
                        return {
                            id: user.id,
                            name: user.displayName,
                            role: user.role,
                            communeId: user.communeId,
                        }
                    }
                }
                return null
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Add role and communeId to the token on first login
            if (user) {
                token.id = user.id
                token.role = (user as any).role
                token.communeId = (user as any).communeId
            }
            return token
        },
        async session({ session, token }) {
            // Add role and communeId to the session from JWT
            if (session.user) {
                (session.user as any).id = token.id as string
                (session.user as any).role = token.role as string
                (session.user as any).communeId = token.communeId as string | null
            }
            return session
        },
    },
})
