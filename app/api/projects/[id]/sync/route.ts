import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { fetchGitHubRepoDetails } from "@/lib/github"

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const project = await prisma.project.findUnique({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        })

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        if (!project.githubRepo) {
            return NextResponse.json({ error: "No GitHub repository linked" }, { status: 400 })
        }

        const repoDetails = await fetchGitHubRepoDetails(project.githubRepo)

        if (repoDetails) {
            const updatedProject = await prisma.project.update({
                where: { id: params.id },
                data: {
                    lastCommit: repoDetails.lastCommitDate,
                },
            })
            return NextResponse.json(updatedProject)
        }

        return NextResponse.json({ message: "No updates found or failed to fetch" })
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to sync project" },
            { status: 500 }
        )
    }
}
