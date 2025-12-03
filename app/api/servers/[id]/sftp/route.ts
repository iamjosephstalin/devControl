import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { listSFTPDirectory, readSFTPFile, writeSFTPFile, deleteSFTPFile, createSFTPDirectory } from "@/lib/sftp"
import { decrypt } from "@/lib/encryption"


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

    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || "/"
    const action = searchParams.get("action") || "list"

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

    if (action === "list") {
      const files = await listSFTPDirectory(sshConfig, path)
      return NextResponse.json({ files, path })
    } else if (action === "read") {
      const fileContent = await readSFTPFile(sshConfig, path)
      return NextResponse.json({
        content: fileContent.toString('utf-8'),
        path,
      })
    } else if (action === "download") {
      const fileContent = await readSFTPFile(sshConfig, path)
      const filename = path.split('/').pop() || 'file'
      
      return new NextResponse(new Uint8Array(fileContent), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to perform SFTP operation" },
      { status: 500 }
    )
  }
}

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

    // Check if this is a file upload (FormData)
    const contentType = request.headers.get("content-type") || ""
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File
      const remotePath = formData.get("path") as string

      if (!file || !remotePath) {
        return NextResponse.json(
          { error: "File and path are required" },
          { status: 400 }
        )
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      await writeSFTPFile(sshConfig, remotePath, buffer)
      return NextResponse.json({ success: true })
    }

    // Handle JSON requests
    const body = await request.json()
    const { action, path, content } = body

    if (action === "write") {
      await writeSFTPFile(sshConfig, path, Buffer.from(content, 'utf-8'))
      return NextResponse.json({ success: true })
    } else if (action === "delete") {
      await deleteSFTPFile(sshConfig, path)
      return NextResponse.json({ success: true })
    } else if (action === "mkdir") {
      await createSFTPDirectory(sshConfig, path)
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to perform SFTP operation" },
      { status: 500 }
    )
  }
}

