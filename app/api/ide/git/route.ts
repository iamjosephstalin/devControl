import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import simpleGit from "simple-git"
import path from "path"
import os from "os"

const WORKSPACES_ROOT = path.join(os.homedir(), ".gemini", "workspaces")

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const userId = await validateSessionUser(session?.user?.id)

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const workspaceId = searchParams.get("workspaceId")

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
        }

        const workspacePath = path.join(WORKSPACES_ROOT, workspaceId)
        const git = simpleGit(workspacePath)

        const status = await git.status()

        return NextResponse.json(status)

    } catch (error: any) {
        console.error("Git Status API error:", error)
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const userId = await validateSessionUser(session?.user?.id)

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { workspaceId, action, files, message } = await request.json()

        if (!workspaceId || !action) {
            return NextResponse.json({ error: "Workspace ID and action are required" }, { status: 400 })
        }

        const workspacePath = path.join(WORKSPACES_ROOT, workspaceId)
        const git = simpleGit(workspacePath)

        let result

        switch (action) {
            case "add":
                if (!files || files.length === 0) {
                    // Add all
                    await git.add('.')
                    result = "Staged all changes"
                } else {
                    await git.add(files)
                    result = `Staged ${files.length} files`
                }
                break
            case "commit":
                if (!message) {
                    return NextResponse.json({ error: "Commit message is required" }, { status: 400 })
                }
                const commitSummary = await git.commit(message)
                result = `Committed: ${commitSummary.summary.changes} changes`
                break
            case "push":
                await git.push()
                result = "Pushed changes to remote"
                break
            case "pull":
                const pullSummary = await git.pull()
                result = `Pulled changes: ${pullSummary.summary.changes} changes`
                break
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: result })

    } catch (error: any) {
        console.error("Git Operation API error:", error)
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        )
    }
}
