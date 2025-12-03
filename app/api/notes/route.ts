import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"
import { requirePermissionForUser, getDataFilter } from "@/lib/rbac"

export const runtime = 'nodejs'

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
    const user = await requirePermissionForUser(userId, 'notes', 'read')

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    // Apply data filter based on user role
    let dataFilter = getDataFilter('notes', user.id, user.role)

    // Add project filter if specified
    if (projectId) {
      dataFilter = {
        AND: [
          dataFilter,
          { projectId }
        ]
      } as any
    }

    const notes = await prisma.note.findMany({
      where: dataFilter,
      include: {
        project: {
          select: { id: true, title: true }
        }
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

    console.log(`📝 Notes API: ${user.role} ${user.email} accessed ${processedNotes.length} notes`)

    return NextResponse.json(processedNotes)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Notes API error:', error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
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
    const user = await requirePermissionForUser(userId, 'notes', 'write')

    const body = await request.json()
    const { title, content, tags, projectId, isEncrypted } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // ProjectId is optional - notes can be general or project-specific

    // Check if user has access to the specified project (if projectId provided)
    if (projectId && projectId !== "none" && user.role !== 'admin') {
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
          { error: "Access denied: You don't have permission to create notes in this project" },
          { status: 403 }
        )
      }
    }

    let noteData: any = {
      tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
      projectId: projectId === "none" ? null : projectId, // Can be null for general notes
      userId: user.id,
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

    console.log(`📝 Note created: ${user.role} ${user.email} created "${title}" in project ${projectId}`)

    return NextResponse.json(note)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Failed to create note", details: error.message },
      { status: 500 }
    )
  }
}


