import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

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

