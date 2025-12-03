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
    const user = await requirePermissionForUser(userId, 'projects', 'read')

    // Apply data filter based on user role
    let projects

    console.log(`🔍 Debug - User: ${user.email}, Role: ${user.role}`)

    if (user.role === 'admin') {
      // Admin sees all projects
      console.log(`🔍 Admin query - Getting all projects`)
      projects = await prisma.project.findMany({
        include: {
          tasks: {
            select: { id: true, status: true, priority: true }
          },
          secrets: {
            select: { id: true }
          },
          projectAssignments: {
            select: { 
              userId: true,
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { updatedAt: "desc" },
      })
    } else {
      // Client sees only assigned projects - use explicit query
      console.log(`🔍 Client query - Finding projects for user ${user.id}`)
      
      // First, let's get all projects and filter manually to debug
      const allProjects = await prisma.project.findMany({
        include: {
          projectAssignments: {
            select: { 
              userId: true,
              user: {
                select: { name: true, email: true }
              }
            }
          },
          tasks: {
            select: { id: true, status: true, priority: true }
          },
          secrets: {
            select: { id: true }
          }
        },
        orderBy: { updatedAt: "desc" },
      })
      
      console.log(`🔍 All projects count: ${allProjects.length}`)
      allProjects.forEach(p => {
        console.log(`🔍 Project "${p.title}":`, {
          hasAssignments: !!p.projectAssignments,
          assignmentCount: p.projectAssignments?.length || 0,
          allKeys: Object.keys(p)
        })
        if (p.projectAssignments) {
          p.projectAssignments.forEach((a: any) => {
            console.log(`   Assignment: ${a.userId} (${a.user?.email})`)
          })
        }
      })
      
      // Filter projects where user is assigned
      projects = allProjects.filter(project => 
        project.projectAssignments && 
        project.projectAssignments.some((assignment: any) => assignment.userId === user.id)
      )
      
      console.log(`🔍 Filtered projects for ${user.email}: ${projects.length}`)
    }

    console.log(`📋 Projects API: ${user.role} ${user.email} accessed ${projects.length} projects`)
    
    if (user.role === 'client') {
      console.log(`🔍 Client projects found:`, projects.map(p => ({ id: p.id, title: p.title })))
    }

    return NextResponse.json(projects)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error.message },
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
    const user = await requirePermissionForUser(userId, 'projects', 'write')

    const body = await request.json()
    const { title, description, techStack, githubRepo, deployment, status, tags, deploymentUrl } = body

    const project = await prisma.project.create({
      data: {
        title,
        description,
        techStack: JSON.stringify(techStack || []),
        tags: JSON.stringify(tags || []),
        githubRepo,
        deployment: deployment || "local",
        deploymentUrl,
        status: status || "active",
        userId: user.id,
      },
    })

    console.log(`✅ Project created: ${user.role} ${user.email} created "${title}"`)

    return NextResponse.json(project)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: "Failed to create project", details: error.message },
      { status: 500 }
    )
  }
}


