import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch project" },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, techStack, githubRepo, deployment, status } = body

    const project = await prisma.project.updateMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(techStack && { techStack: JSON.stringify(techStack) }),
        ...(githubRepo !== undefined && { githubRepo }),
        ...(deployment && { deployment }),
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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update project" },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.project.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}

