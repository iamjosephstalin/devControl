import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
    const userId = searchParams.get("userId")

    if (userId) {
      const permissions = await prisma.permission.findMany({
        where: { userId },
        orderBy: { resource: "asc" },
      })
      return NextResponse.json(permissions)
    }

    // Get all permissions grouped by user
    const permissions = await prisma.permission.findMany({
      orderBy: { userId: "asc" },
    })

    return NextResponse.json(permissions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch permissions" },
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
    const { userId, resource, action } = body

    if (!userId || !resource || !action) {
      return NextResponse.json(
        { error: "userId, resource, and action are required" },
        { status: 400 }
      )
    }

    const permission = await prisma.permission.upsert({
      where: {
        userId_resource_action: {
          userId,
          resource,
          action,
        },
      },
      update: {},
      create: {
        userId,
        resource,
        action,
      },
    })

    return NextResponse.json(permission, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create permission" },
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

    if (!id) {
      return NextResponse.json(
        { error: "Permission ID is required" },
        { status: 400 }
      )
    }

    await prisma.permission.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete permission" },
      { status: 500 }
    )
  }
}

