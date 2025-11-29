import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const projectId = searchParams.get("projectId")

    const where: any = {}
    if (userId) where.userId = userId
    if (projectId) where.projectId = projectId

    // Clients can only see their own assignments
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (currentUser?.role !== "admin" && userId && userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const assignments = await prisma.projectAssignment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(assignments)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch project assignments" },
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
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, projectId, role } = body

    if (!userId || !projectId) {
      return NextResponse.json(
        { error: "userId and projectId are required" },
        { status: 400 }
      )
    }

    const assignment = await prisma.projectAssignment.upsert({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      update: {
        role: role || "viewer",
      },
      create: {
        userId,
        projectId,
        role: role || "viewer",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
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
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Assignment ID is required" },
        { status: 400 }
      )
    }

    await prisma.projectAssignment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete assignment" },
      { status: 500 }
    )
  }
}

