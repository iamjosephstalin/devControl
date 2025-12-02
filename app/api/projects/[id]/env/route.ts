import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { encrypt, decrypt } from "@/lib/encryption"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: params.id, userId: session.user.id },
        })

        if (!project) return new NextResponse("Project not found", { status: 404 })

        const envFiles = await prisma.secret.findMany({
            where: {
                projectId: params.id,
                type: "env_file",
            },
            orderBy: { createdAt: "desc" },
        })

        // Decrypt values for the editor
        const decryptedEnvFiles = envFiles.map(file => ({
            ...file,
            value: decrypt(file.encryptedValue),
        }))

        return NextResponse.json(decryptedEnvFiles)
    } catch (error) {
        console.error("Failed to fetch env files:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { name, content } = await req.json()

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: params.id, userId: session.user.id },
        })

        if (!project) return new NextResponse("Project not found", { status: 404 })

        const encryptedValue = encrypt(content)

        const secret = await prisma.secret.create({
            data: {
                name,
                type: "env_file",
                encryptedValue,
                projectId: params.id,
                userId: session.user.id,
            },
        })

        return NextResponse.json(secret)
    } catch (error) {
        console.error("Failed to create env file:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { id, content } = await req.json()

        // Verify ownership via the secret itself
        const secret = await prisma.secret.findUnique({
            where: { id }
        })

        if (!secret) {
            return new NextResponse("Secret not found", { status: 404 })
        }

        const project = await prisma.project.findUnique({
            where: { id: secret.projectId }
        })

        if (!project || project.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const encryptedValue = encrypt(content)

        const updatedSecret = await prisma.secret.update({
            where: { id },
            data: {
                encryptedValue,
            },
        })

        return NextResponse.json(updatedSecret)
    } catch (error) {
        console.error("Failed to update env file:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
