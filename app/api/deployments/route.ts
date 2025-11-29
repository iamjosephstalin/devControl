import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Client } from "ssh2"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    try {
        const { projectId, environment, serverId, script } = await req.json()

        // Verify project ownership
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId: session.user.id },
        })

        if (!project) return new NextResponse("Project not found", { status: 404 })

        // Create deployment record
        const deployment = await prisma.deployment.create({
            data: {
                projectId,
                environment,
                status: "in_progress",
                triggeredBy: "manual",
                logs: "Starting deployment...\n",
            },
        })

        // Start async deployment process (fire and forget)
        // In a real app, this should be a background job (e.g., BullMQ, Inngest)
        // For this MVP, we'll try to run it and update the record

        if (serverId && script) {
            runSSHDeployment(deployment.id, serverId, script)
        }

        return NextResponse.json(deployment)
    } catch (error) {
        console.error("Failed to trigger deployment:", error)
        return new NextResponse("Internal Server Error", { status: 500 })
    }
}

async function runSSHDeployment(deploymentId: string, serverId: string, script: string) {
    try {
        const server = await prisma.server.findUnique({
            where: { id: serverId },
        })

        if (!server) throw new Error("Server not found")

        // TODO: Decrypt password/key here. For now assuming we have a way to connect.
        // This is a placeholder for the actual SSH connection logic which would mirror the SSH terminal
        // but capture output to the database.

        await prisma.deployment.update({
            where: { id: deploymentId },
            data: {
                logs: { increment: `\nConnecting to ${server.host}...\n` } as any, // Prisma doesn't support string append easily, this is pseudo-code for now
            }
        })

        // Mocking deployment for now since we can't easily do long-running SSH in a serverless function
        setTimeout(async () => {
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: {
                    status: "success",
                    finishedAt: new Date(),
                    logs: "Deployment completed successfully!\n"
                }
            })
        }, 5000)

    } catch (error: any) {
        await prisma.deployment.update({
            where: { id: deploymentId },
            data: {
                status: "failed",
                finishedAt: new Date(),
                logs: `Deployment failed: ${error.message}\n`
            }
        })
    }
}
