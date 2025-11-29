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

    // Get user role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    let projects

    if (user?.role === "admin") {
      // Admins see all projects
      projects = await prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          tasks: true,
          notes: true,
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })
    } else {
      // Clients see only assigned projects
      const assignments = await prisma.projectAssignment.findMany({
        where: { userId: session.user.id },
        include: {
          project: {
            include: {
              tasks: true,
              notes: true,
            },
          },
        },
      })
      projects = assignments.map((a) => a.project)
    }

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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

    const body = await request.json()
    const { title, description, techStack, githubRepo, deployment, status } = body

    const project = await prisma.project.create({
      data: {
        title,
        description,
        techStack: JSON.stringify(techStack || []),
        githubRepo,
        deployment: deployment || "local",
        status: status || "active",
        userId: session.user.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}

