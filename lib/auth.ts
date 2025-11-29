import { getServerSession, NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || "client",
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== "admin") {
    throw new Error("Forbidden - Admin access required")
  }
  return session
}

export async function hasPermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // Admins have all permissions
  if (user?.role === "admin") {
    return true
  }

  // Check specific permission
  const permission = await prisma.permission.findUnique({
    where: {
      userId_resource_action: {
        userId,
        resource,
        action,
      },
    },
  })

  return !!permission
}

export async function hasProjectAccess(
  userId: string,
  projectId: string,
  requiredRole: "viewer" | "editor" | "admin" = "viewer"
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  // Admins have access to all projects
  if (user?.role === "admin") {
    return true
  }

  // Check project assignment
  const assignment = await prisma.projectAssignment.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  })

  if (!assignment) {
    return false
  }

  // Check role hierarchy
  const roleHierarchy = { viewer: 1, editor: 2, admin: 3 }
  const userRoleLevel = roleHierarchy[assignment.role as keyof typeof roleHierarchy] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

