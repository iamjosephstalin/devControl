import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")

    if (role) {
      // Get permissions for a specific role
      const permissions = await prisma.permission.findMany({
        where: { role: role.toLowerCase() },
        orderBy: { resource: "asc" },
      })
      return NextResponse.json(permissions)
    }

    // Get all permissions grouped by role
    const permissions = await prisma.permission.findMany({
      orderBy: { resource: "asc" },
    })

    const groupedPermissions = {
      admin: permissions.filter((p: any) => p.role === 'admin'),
      client: permissions.filter((p: any) => p.role === 'client')
    }

    return NextResponse.json(groupedPermissions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch permissions" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const role = searchParams.get("role")
    const resource = searchParams.get("resource")
    const action = searchParams.get("action")

    if (id) {
      // Delete by ID
      await prisma.permission.delete({
        where: { id }
      })
    } else if (role && resource && action) {
      // Delete by role, resource, action combination
      const permission = await prisma.permission.findFirst({
        where: {
          role: role.toLowerCase(),
          resource,
          action,
        }
      })

      if (permission) {
        await prisma.permission.delete({
          where: { id: permission.id }
        })
      }
    } else {
      return NextResponse.json(
        { error: "Either id or role+resource+action must be provided" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Permission deletion failed:", error.message)
    return NextResponse.json(
      { error: "Failed to delete permission", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { role, resource, action } = body

    if (!role || !resource || !action) {
      return NextResponse.json(
        { error: "role, resource, and action are required" },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'client'].includes(role.toLowerCase())) {
      return NextResponse.json(
        { error: "Role must be either 'admin' or 'client'" },
        { status: 400 }
      )
    }

    // Create or update role-based permission
    try {
      // First try to find existing permission
      const existingPermission = await prisma.permission.findFirst({
        where: {
          role: role.toLowerCase(),
          resource,
          action,
        },
      })

      if (existingPermission) {
        // Permission already exists, just return it
        return NextResponse.json(existingPermission, { status: 200 })
      }

      // Create new permission without specifying ID - let database generate it
      const permission = await prisma.permission.create({
        data: {
          role: role.toLowerCase(),
          resource,
          action,
        },
      })
      
      return NextResponse.json(permission, { status: 201 })
    } catch (error: any) {
      console.error("Permission creation failed:", error.message)
      
      // If it's a duplicate key error, try to find and return existing permission
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        try {
          const existingPermission = await prisma.permission.findFirst({
            where: {
              role: role.toLowerCase(),
              resource,
              action,
            },
          })
          if (existingPermission) {
            return NextResponse.json(existingPermission, { status: 200 })
          }
        } catch (findError) {
          console.error("Failed to find existing permission after duplicate error:", findError)
        }
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create permission", 
          details: error.message 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create permission" },
      { status: 500 }
    )
  }
}

