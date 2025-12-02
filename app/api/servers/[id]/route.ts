import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
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

    const server = await prisma.server.findFirst({
      where: {
        id: params.id,
        userId,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true,
        provider: true,
        region: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 })
    }

    return NextResponse.json(server)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch server" },
      { status: 500 }
    )
  }
}
