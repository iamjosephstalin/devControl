import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/encryption"

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Ensure logs appear in Vercel by using console methods and process.stdout
  const logToVercel = (message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage, data || '')
    // Force flush to ensure logs appear in Vercel
    if (typeof process !== 'undefined' && process.stdout) {
      process.stdout.write('')
    }
  }
  
  try {
    logToVercel(`🔐 GET /api/secrets/${params.id} - Starting request`)
    
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    logToVercel(`🔒 Authentication check`, { userId: !!userId, sessionExists: !!session })
    
    if (!userId) {
      logToVercel(`❌ Unauthorized access attempt to secret ${params.id}`)
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    logToVercel(`🔍 Looking up secret ${params.id} for user ${userId}`)
    
    const secret = await prisma.secret.findFirst({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!secret) {
      logToVercel(`❌ Secret not found: ${params.id} for user ${userId}`)
      return NextResponse.json({ error: "Secret not found" }, { status: 404 })
    }

    logToVercel(`🔓 Secret found, decrypting value for ${params.id}`)
    
    // Decrypt and return the value
    const decryptedValue = decrypt(secret.encryptedValue)
    
    logToVercel(`✅ Successfully decrypted and returning secret ${params.id}`)

    return NextResponse.json({
      ...secret,
      encryptedValue: undefined,
      value: decryptedValue,
    })
  } catch (error: any) {
    const errorMessage = `❌ Failed to fetch secret ${params.id}: ${error.message}`
    console.error(errorMessage)
    console.error('Error stack:', error.stack)
    // Force flush for errors
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write('')
    }
    
    return NextResponse.json(
      { error: "Failed to fetch secret", details: error.message },
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
        userId,
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
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    await prisma.secret.deleteMany({
      where: {
        id: params.id,
        userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete secret", details: error.message },
      { status: 500 }
    )
  }
}

