import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/encryption"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where: any = { userId: session.user.id }
    if (projectId) where.projectId = projectId

    const secrets = await prisma.secret.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Don't send encrypted values, only metadata
    const safeSecrets = secrets.map((secret) => ({
      ...secret,
      encryptedValue: undefined,
    }))

    return NextResponse.json(safeSecrets)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch secrets" },
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
    const { name, type, value, description, projectId, serverId } = body

    if (!name || !type || !value) {
      return NextResponse.json(
        { error: "Name, type, and value are required" },
        { status: 400 }
      )
    }

    const encryptedValue = encrypt(value)

    const secret = await prisma.secret.create({
      data: {
        name,
        type,
        encryptedValue,
        description,
        projectId: projectId || null,
        serverId: serverId || null,
        userId: session.user.id,
      },
    })

    // Don't send encrypted value
    const { encryptedValue: _, ...safeSecret } = secret

    return NextResponse.json(safeSecret)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create secret" },
      { status: 500 }
    )
  }
}

