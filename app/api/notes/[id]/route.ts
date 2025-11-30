import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
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

    const note = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Decrypt if encrypted
    if (note.isEncrypted) {
      try {
        return NextResponse.json({
          ...note,
          title: note.encryptedTitle ? decrypt(note.encryptedTitle) : note.title,
          content: decrypt(note.content),
        })
      } catch (error) {
        console.error("Failed to decrypt note:", note.id, error)
        return NextResponse.json({
          ...note,
          title: "[Encrypted - Unable to decrypt]",
          content: "[Encrypted content - Unable to decrypt]",
        })
      }
    }

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch note" },
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
    const { title, content, tags, isEncrypted } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Check if note exists and belongs to user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    let updateData: any = {
      tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
      isEncrypted: isEncrypted || false,
    }

    if (isEncrypted) {
      // Encrypt the content and title
      updateData.content = encrypt(content)
      updateData.encryptedTitle = encrypt(title)
      updateData.title = `[Encrypted] ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`
    } else {
      updateData.title = title
      updateData.content = content
      updateData.encryptedTitle = null // Clear encrypted title if switching to unencrypted
    }

    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Failed to update note:", error)
    return NextResponse.json(
      { error: "Failed to update note" },
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

    await prisma.note.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}

