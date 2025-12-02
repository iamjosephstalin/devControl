import { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db-helpers"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  // Using JWT strategy only - no database adapter needed
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

        try {
          console.log('Auth: Looking up user with email:', credentials.email)
          console.log('Auth: Environment:', process.env.NODE_ENV)
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })
          
          console.log('Auth: User found:', !!user)
          if (user) {
            console.log('Auth: User role:', user.role)
            console.log('Auth: User data:', { id: user.id, email: user.email, name: user.name, role: user.role })
          }

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

          const returnUser = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role || "client",
          }
          
          console.log('Auth: Returning user object:', returnUser)
          return returnUser
        } catch (err) {
          console.error('Auth error:', err)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log('JWT Callback - User provided:', { id: user.id, email: user.email, role: user.role })
        token.id = user.id
        token.role = user.role
        console.log('JWT Callback - Token after update:', { id: token.id, role: token.role, email: token.email })
      }
      return token
    },
    async session({ session, token }) {
      console.log('Session Callback - Token received:', { id: token.id, role: token.role, email: token.email })
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        console.log('Session Callback - Session after update:', { 
          id: session.user.id, 
          email: session.user.email, 
          role: session.user.role 
        })
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
  
  // Verify user exists in database (important after database migrations)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (!user) {
    throw new Error("User not found in database. Please log out and log back in.")
  }
  
  return session
}

/**
 * Validates that the user from the session exists in the database
 * Returns the user ID if valid, null otherwise
 */
export async function validateSessionUser(sessionUserId: string | undefined): Promise<string | null> {
  if (!sessionUserId) {
    return null
  }
  
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId }
  })
  
  return user?.id || null
}

export async function requireAdmin() {
  const session = await requireAuth()
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
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
    where: { id: userId }
  })

  // Admins have all permissions
  if (user?.role === "admin") {
    return true
  }

  // Check specific permission
  const permission = await prisma.permission.findFirst({
    where: {
      userId,
      resource,
      action,
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
    where: { id: userId }
  })

  // Admins have access to all projects
  if (user?.role === "admin") {
    return true
  }

  // Check project assignment
  const assignment = await prisma.projectAssignment.findFirst({
    where: {
      userId,
      projectId,
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

