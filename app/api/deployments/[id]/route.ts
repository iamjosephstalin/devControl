import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const deployment = await prisma.deployment.findUnique({
            where: { id: params.id },
            include: {
                project: {
                    select: {
                        userId: true
                    }
                }
            }
        })

        if (!deployment) return new NextResponse("Deployment not found", { status: 404 })
        if (deployment.project.userId !== session.user.id) return new NextResponse("Unauthorized", { status: 401 })

        return NextResponse.json(deployment)
    } catch (error) {
        console.error("Failed to fetch deployment:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}
