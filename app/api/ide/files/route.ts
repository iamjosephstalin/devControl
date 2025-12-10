import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import fs from "fs/promises"
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
        const relativePath = searchParams.get("path") || ""

        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 })
        }

        // Security check: prevent directory traversal
        const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '')
        const fullPath = path.join(WORKSPACES_ROOT, workspaceId, safePath)

        if (!fullPath.startsWith(path.join(WORKSPACES_ROOT, workspaceId))) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 })
        }

        try {
            const stats = await fs.stat(fullPath)

            if (stats.isDirectory()) {
                const entries = await fs.readdir(fullPath, { withFileTypes: true })
                const files = entries.map(entry => ({
                    name: entry.name,
                    path: path.join(safePath, entry.name).replace(/\\/g, '/'),
                    type: entry.isDirectory() ? "directory" : "file"
                }))
                // Sort: directories first, then files
                files.sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name)
                    return a.type === "directory" ? -1 : 1
                })
                return NextResponse.json(files)
            } else {
                const content = await fs.readFile(fullPath, "utf-8")
                return NextResponse.json({ content, path: safePath })
            }
        } catch (error) {
            return NextResponse.json({ error: "File not found" }, { status: 404 })
        }

    } catch (error: any) {
        console.error("Files API error:", error)
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

        const { workspaceId, path: relativePath, content } = await request.json()

        if (!workspaceId || !relativePath) {
            return NextResponse.json({ error: "Workspace ID and path are required" }, { status: 400 })
        }

        // Security check
        const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '')
        const fullPath = path.join(WORKSPACES_ROOT, workspaceId, safePath)

        if (!fullPath.startsWith(path.join(WORKSPACES_ROOT, workspaceId))) {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 })
        }

        await fs.writeFile(fullPath, content, "utf-8")

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("Files Write API error:", error)
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        )
    }
}
