import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { tasks, projectId } = await req.json()

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        })

        if (!project) return new NextResponse("Project not found", { status: 404 })

        // Update tasks in a transaction
        await prisma.$transaction(
            tasks.map((task: any) =>
                prisma.task.update({
                    where: { id: task.id },
                    data: {
                        status: task.status,
                        position: task.position,
                    },
                })
            )
        )

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to reorder tasks:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
