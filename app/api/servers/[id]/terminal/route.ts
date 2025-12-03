import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"

// This endpoint provides server connection info for WebSocket terminal
// The actual terminal will use WebSocket for real-time communication

export const runtime = 'nodejs'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        encryptedPassword: true,
        sshKeyPath: true,
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // Return connection info (password will be decrypted on the server side for WebSocket)
    return NextResponse.json({
      serverId: server.id,
      name: server.name,
      host: server.host,
      port: server.port,
      username: server.username,
      hasPassword: !!server.encryptedPassword,
      hasKey: !!server.sshKeyPath,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to get server info" },
      { status: 500 }
    )
  }
}

