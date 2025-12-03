import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/encryption"
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
    const user = await requirePermissionForUser(userId, 'secrets', 'read')

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    // Apply data filter based on user role
    let dataFilter = getDataFilter('secrets', user.id, user.role)

    // Add project filter if specified
    if (projectId) {
      dataFilter = {
        AND: [
          dataFilter,
          { projectId }
        ]
      } as any
    }

    const secrets = await prisma.secret.findMany({
      where: dataFilter,
      include: {
        project: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: "desc" },
    })

    // Don't send encrypted values, only metadata
    const safeSecrets = secrets.map((secret) => ({
      ...secret,
      encryptedValue: undefined,
    }))

    console.log(`🔐 Secrets API: ${user.role} ${user.email} accessed ${safeSecrets.length} secrets`)

    return NextResponse.json(safeSecrets)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Secrets API error:', error)
    return NextResponse.json(
      { error: "Failed to fetch secrets" },
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

    // Check permission using RBAC system - clients can only read secrets, not write
    const user = await requirePermissionForUser(userId, 'secrets', 'write')

    const body = await request.json()
    const { name, type, value, description, projectId, serverId } = body

    if (!name || !type || !value) {
      return NextResponse.json(
        { error: "Name, type, and value are required" },
        { status: 400 }
      )
    }

    // ProjectId is REQUIRED for all secrets
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required. All secrets must be linked to a project." },
        { status: 400 }
      )
    }

    // Check if user has access to the specified project
    if (user.role !== 'admin') {
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
          { error: "Access denied: You don't have permission to create secrets in this project" },
          { status: 403 }
        )
      }
    }

    const encryptedValue = encrypt(value)

    const secret = await prisma.secret.create({
      data: {
        name,
        type,
        encryptedValue,
        description,
        projectId: projectId, // Always required now
        serverId: serverId || null,
        userId: user.id,
      },
    })

    console.log(`🔐 Secret created: ${user.role} ${user.email} created "${name}" (${type})`)

    // Don't send encrypted value
    const { encryptedValue: _, ...safeSecret } = secret

    return NextResponse.json(safeSecret)
  } catch (error: any) {
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    console.error('Secret creation error:', error)
    return NextResponse.json(
      { error: "Failed to create secret" },
      { status: 500 }
    )
  }
}


