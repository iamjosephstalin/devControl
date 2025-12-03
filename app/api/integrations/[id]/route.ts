import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db-helpers"
import { decrypt, encrypt } from "@/lib/encryption"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    if (integration.userId !== sessionUserId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Decrypt configuration for this specific integration
    let config: any = {}
    try {
      if (integration.encryptedConfig) {
        const decrypted = decrypt(integration.encryptedConfig)
        config = JSON.parse(decrypted)
      }
    } catch (error) {
      console.error("Failed to decrypt integration config for", params.id, ":", error)
      return NextResponse.json({ 
        error: "Failed to decrypt integration configuration. The integration may be corrupted." 
      }, { status: 500 })
    }

    return NextResponse.json({
      id: integration.id,
      type: integration.type,
      name: integration.name,
      status: integration.status,
      lastSync: integration.lastSync,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
      config: {
        teamId: config.teamId || null,
        baseUrl: config.baseUrl || null,
        username: config.username || null,
        // Include token for authenticated requests from this endpoint
        token: config.token
      }
    })
  } catch (error: any) {
    console.error("Error in GET /api/integrations/[id]:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch integration" },
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
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration || integration.userId !== sessionUserId) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    const body = await request.json()
    const { name, token, config = {}, status } = body

    let updateData: any = {}

    if (name) updateData.name = name
    if (status) updateData.status = status
    
    // If token or config provided, update encrypted config
    if (token || Object.keys(config).length > 0) {
      // Get existing config
      let existingConfig: any = {}
      try {
        if (integration.encryptedConfig) {
          existingConfig = JSON.parse(decrypt(integration.encryptedConfig))
        }
      } catch (error) {
        console.error("Failed to decrypt existing config:", error)
      }

      // Merge with new config
      const newConfig = {
        ...existingConfig,
        ...config,
        ...(token && { token })
      }

      updateData.encryptedConfig = encrypt(JSON.stringify(newConfig))
      updateData.lastSync = new Date()
    }

    updateData.updatedAt = new Date()

    const updatedIntegration = await prisma.integration.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({
      id: updatedIntegration.id,
      type: updatedIntegration.type,
      name: updatedIntegration.name,
      status: updatedIntegration.status,
      lastSync: updatedIntegration.lastSync,
      createdAt: updatedIntegration.createdAt,
      updatedAt: updatedIntegration.updatedAt
    })
  } catch (error: any) {
    console.error("Error in PUT /api/integrations/[id]:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update integration" },
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
    const sessionUserId = await validateSessionUser(session?.user?.id)
    
    if (!sessionUserId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    })

    if (!integration || integration.userId !== sessionUserId) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 })
    }

    await prisma.integration.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/integrations/[id]:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete integration" },
      { status: 500 }
    )
  }
}