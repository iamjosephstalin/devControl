import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { executeSSHCommand } from "@/lib/ssh"
import { decrypt } from "@/lib/encryption"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { command } = body

    if (!command) {
      return NextResponse.json(
        { error: "Command is required" },
        { status: 400 }
      )
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

    // Check if we have authentication method
    if (!server.encryptedPassword && !server.sshKeyPath) {
      return NextResponse.json(
        { error: "No authentication method configured (password or SSH key required)" },
        { status: 400 }
      )
    }

    const sshConfig = {
      host: server.host,
      port: server.port,
      username: server.username,
      password: server.encryptedPassword ? decrypt(server.encryptedPassword) : undefined,
      privateKey: server.sshKeyPath ? undefined : undefined, // TODO: Read key file from path
    }

    const result = await executeSSHCommand(sshConfig, command)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to execute command" },
      { status: 500 }
    )
  }
}

