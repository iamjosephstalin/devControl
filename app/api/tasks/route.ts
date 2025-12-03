import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { requirePermissionForUser, getDataFilter } from "@/lib/rbac"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    // Check permission using RBAC system
    const user = await requirePermissionForUser(userId, 'tasks', 'read')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")

    // Apply data filter based on user role
    let dataFilter = getDataFilter('tasks', user.id, user.role)

    // Add additional filters
    const additionalFilters: any = {}
    if (status) additionalFilters.status = status
    if (projectId) additionalFilters.projectId = projectId

    // Combine role-based filter with additional filters
    const where = Object.keys(additionalFilters).length > 0 
      ? { AND: [dataFilter, additionalFilters] } as any
      : dataFilter

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true }
        }
      },
      orderBy: { position: "asc" },
    })

    console.log(`📋 Tasks API: ${user.role} ${user.email} accessed ${tasks.length} tasks`)

    return NextResponse.json(tasks)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Tasks API error:', error)
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

    // Check permission using RBAC system
    const user = await requirePermissionForUser(userId, 'tasks', 'write')

    const body = await request.json()
    const { title, description, status, priority, dueDate, projectId } = body

    // ProjectId is optional - tasks can be general or project-specific

    // Check if user has access to the specified project (if projectId provided)
    if (projectId && user.role !== 'admin') {
      const projectFilter = getDataFilter('projects', user.id, user.role)
      const hasProjectAccess = await prisma.project.findFirst({
        where: { 
          AND: [
            { id: projectId },
            projectFilter
          ]
        }
      })
      
      if (!hasProjectAccess) {
        return NextResponse.json(
          { error: "Access denied: You don't have permission to create tasks in this project" },
          { status: 403 }
        )
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "backlog",
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: projectId || null, // Can be null for general tasks
        userId: user.id,
      },
    })

    console.log(`✅ Task created: ${user.role} ${user.email} created "${title}"`)

    return NextResponse.json(task)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Failed to create task", details: error.message },
      { status: 500 }
    )
  }
}


