import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt } from "@/lib/encryption"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    const where: any = { userId }
    if (projectId) where.projectId = projectId

    const servers = await prisma.server.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    // Don't send encrypted passwords
    const safeServers = servers.map((server) => ({
      ...server,
      encryptedPassword: undefined,
    }))

    return NextResponse.json(safeServers)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch servers" },
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

    const body = await request.json()
    const { name, host, port, username, password, sshKeyPath, provider, region, projectId } = body

    if (!name || !host || !username) {
      return NextResponse.json(
        { error: "Name, host, and username are required" },
        { status: 400 }
      )
    }

    const server = await prisma.server.create({
      data: {
        name,
        host,
        port: port || 22,
        username,
        encryptedPassword: password ? encrypt(password) : null,
        sshKeyPath: sshKeyPath || null,
        provider: provider || "other",
        region: region || null,
        projectId: projectId || null,
        userId,
      },
    })

    const { encryptedPassword: _, ...safeServer } = server

    return NextResponse.json(safeServer)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create server" },
      { status: 500 }
    )
  }
}


