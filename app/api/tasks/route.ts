import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")

    const where: any = { userId }
    if (status) where.status = status
    if (projectId) where.projectId = projectId

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { position: "asc" },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json(tasks)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch tasks", details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, projectId } = body

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "backlog",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null,
        userId,
      },
    })

    return NextResponse.json(task)
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    )
  }
}

