import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { decrypt } from "@/lib/encryption"

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { envFileId, serverId, path } = await req.json()

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: params.id, userId: session.user.id },
        })

        if (!project) return new NextResponse("Project not found", { status: 404 })

        const envFile = await prisma.secret.findUnique({
            where: { id: envFileId },
        })

        if (!envFile) return new NextResponse("Env file not found", { status: 404 })

        const server = await prisma.server.findUnique({
            where: { id: serverId },
        })

        if (!server) return new NextResponse("Server not found", { status: 404 })

        const content = decrypt(envFile.encryptedValue)

        // TODO: Implement actual SSH write
        // For now, we'll just log it and pretend
        console.log(`[MOCK SSH] Writing to ${server.host}:${path || "/var/www/app/.env"}`)
        console.log(content)

        // Log the activity
        await prisma.activity.create({
            data: {
                type: "server_action",
                description: `Synced ${envFile.name} to ${server.name}`,
                userId: session.user.id,
                metadata: JSON.stringify({ serverId, envFileId, path }),
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to sync env file:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
