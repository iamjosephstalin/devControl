import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import simpleGit from "simple-git"
import fs from "fs/promises"
import path from "path"
import crypto from "crypto"
import os from "os"

// Define workspace root
const WORKSPACES_ROOT = path.join(os.homedir(), ".gemini", "workspaces")

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        const userId = await validateSessionUser(session?.user?.id)

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { repoUrl, name, integrationId } = await request.json()

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 })
        }

        // Ensure workspaces directory exists
        await fs.mkdir(WORKSPACES_ROOT, { recursive: true })

        // Create a unique ID for the workspace based on the repo URL
        const workspaceId = crypto.createHash("md5").update(repoUrl).digest("hex")
        const workspacePath = path.join(WORKSPACES_ROOT, workspaceId)

        const git = simpleGit()

        let message = ""

        // Check if workspace already exists
        try {
            await fs.access(workspacePath)
            // Exists - try to pull (optional, maybe just open)
            // For now, just open
            message = "Workspace opened successfully"
            console.log(`Workspace ${workspaceId} exists. Opening...`)
        } catch (e) {
            // Doesn't exist - clone
            console.log(`Cloning ${repoUrl} to ${workspacePath}...`)

            let cloneUrl = repoUrl
            if (integrationId) {
                try {
                    const { getIntegrationToken } = await import("@/lib/integrations")
                    const token = await getIntegrationToken(integrationId)
                    // Inject token into URL
                    // Handle different providers format if needed, but generic oauth token usually works like this:
                    // https://oauth2:TOKEN@github.com/user/repo.git
                    // Or https://TOKEN@github.com/user/repo.git
                    // For GitHub: https://token@github.com...
                    // For GitLab: oauth2:token@...

                    // Simplest approach: insert token after protocol
                    const urlObj = new URL(repoUrl)
                    urlObj.username = "oauth2" // Often ignored by GitHub but needed by others? GitHub accepts token as username too.
                    // Best for GitHub: just token as username.
                    // GitLab: "oauth2" as user, token as pass.
                    // Bitbucket: x-token-auth:token ?

                    // Let's try flexible approach.
                    if (repoUrl.includes("github.com")) {
                        urlObj.username = token
                    } else if (repoUrl.includes("gitlab.com")) {
                        urlObj.username = "oauth2"
                        urlObj.password = token
                    } else {
                        // Fallback
                        urlObj.username = token
                    }
                    cloneUrl = urlObj.toString()
                } catch (err) {
                    console.error("Failed to get integration token:", err)
                    // Proceed with public clone attempt
                }
            }

            try {
                await git.clone(cloneUrl, workspacePath)
                message = "Repository cloned successfully"
            } catch (cloneError: any) {
                console.error("Clone failed:", cloneError)
                return NextResponse.json(
                    { error: "Failed to clone repository", details: cloneError.message },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json({
            workspaceId,
            path: workspacePath,
            name: name || path.basename(repoUrl, '.git'),
            message
        })

    } catch (error: any) {
        console.error("Workspace API error:", error)
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        )
    }
}
