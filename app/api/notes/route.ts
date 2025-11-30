import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"

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

    const notes = await prisma.note.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Decrypt encrypted notes for display
    const processedNotes = notes.map(note => {
      if (note.isEncrypted) {
        try {
          return {
            ...note,
            title: note.encryptedTitle ? decrypt(note.encryptedTitle) : note.title,
            content: decrypt(note.content),
          }
        } catch (error) {
          console.error("Failed to decrypt note:", note.id, error)
          return {
            ...note,
            title: "[Encrypted - Unable to decrypt]",
            content: "[Encrypted content - Unable to decrypt]",
          }
        }
      }
      return note
    })

    return NextResponse.json(processedNotes)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notes" },
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
    const { title, content, tags, projectId, isEncrypted } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    let noteData: any = {
      tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
      projectId: projectId === "none" ? null : projectId,
      userId: session.user.id,
      isEncrypted: isEncrypted || false,
    }

    if (isEncrypted) {
      // Encrypt the content and optionally the title
      noteData.content = encrypt(content)
      noteData.encryptedTitle = encrypt(title)
      noteData.title = `[Encrypted] ${title.substring(0, 30)}${title.length > 30 ? '...' : ''}`
    } else {
      noteData.title = title
      noteData.content = content
    }

    const note = await prisma.note.create({
      data: noteData,
    })

    return NextResponse.json(note)
  } catch (error: any) {
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Failed to create note", details: error.message },
      { status: 500 }
    )
  }
}

