import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/encryption"
import { Client } from "ssh2"

// This endpoint provides connection credentials for terminal
// The actual terminal connection will be handled client-side via WebSocket or direct connection

export const runtime = 'nodejs'
export async function POST(
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
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    // For security, we'll return a temporary token or handle connection server-side
    // For now, return connection info (password will be decrypted on server for WebSocket)
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
      { error: error.message || "Failed to get connection info" },
      { status: 500 }
    )
  }
}

