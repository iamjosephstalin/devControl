import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const secret = await prisma.secret.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!secret) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    // Decrypt and return the value
    const decryptedValue = decrypt(secret.encryptedValue)

    return NextResponse.json({
      ...secret,
      encryptedValue: undefined,
      value: decryptedValue,
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch secret" },
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
    const { name, type, value, description, projectId, serverId } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (type) updateData.type = type
    if (value) updateData.encryptedValue = encrypt(value)
    if (description !== undefined) updateData.description = description
    if (projectId !== undefined) updateData.projectId = projectId || null
    if (serverId !== undefined) updateData.serverId = serverId || null

    const secret = await prisma.secret.updateMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: updateData,
    })

    if (secret.count === 0) {
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    const updated = await prisma.secret.findUnique({
      where: { id: params.id },
    })

    const { encryptedValue: _, ...safeSecret } = updated!

    return NextResponse.json(safeSecret)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update secret" },
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

    await prisma.secret.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete secret" },
      { status: 500 }
    )
  }
}

