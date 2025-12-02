import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
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

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId,
      },
      include: {
        tasks: {
          orderBy: { createdAt: "desc" },
        },
        notes: {
          orderBy: { updatedAt: "desc" },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch project", details: error.message },
      { status: 500 }
    )
  }
}

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
    const { title, description, techStack, githubRepo, deployment, status, tags, deploymentUrl } = body

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        userId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(techStack && { techStack: JSON.stringify(techStack) }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(githubRepo !== undefined && { githubRepo }),
        ...(deployment && { deployment }),
        ...(deploymentUrl !== undefined && { deploymentUrl }),
        ...(status && { status }),
      },
    })

    if (project.count === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const updated = await prisma.project.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update project", details: error.message },
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

    await prisma.project.deleteMany({
      where: {
        id: params.id,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete project", details: error.message },
      { status: 500 }
    )
  }
}

