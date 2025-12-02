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

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    let projects

    if (user?.role === "admin") {
      // Admins see all projects
      projects = await prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
      })
    } else {
      // Clients see only assigned projects
      const assignments = await prisma.projectAssignment.findMany({
        where: { userId },
      })
      projects = assignments.map((a) => a.project)
    }

    return NextResponse.json(projects)
  } catch (error: any) {
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
        userId,
      },
    })

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create project", details: error.message },
      { status: 500 }
    )
  }
}


