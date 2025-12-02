import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const task = await prisma.task.updateMany({
      where: {
        id: params.id,
        userId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
    })

    if (task.count === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updated = await prisma.task.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update task", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    await prisma.task.deleteMany({
      where: {
        id: params.id,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete task", details: error.message },
      { status: 500 }
    )
  }
}

