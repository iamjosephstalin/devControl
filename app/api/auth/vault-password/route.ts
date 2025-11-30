import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { password, action } = await request.json()

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (action === "set") {
      // Set new vault password
      const hashedPassword = await bcrypt.hash(password, 12)
      await prisma.user.update({
        where: { id: user.id },
        data: { vaultPassword: hashedPassword },
      })
      
      return NextResponse.json({ success: true, message: "Vault password set successfully" })
    } else if (action === "verify") {
      // Verify vault password
      if (!user.vaultPassword) {
        // If no vault password is set, fall back to login password for backward compatibility
        if (!user.password) {
          return NextResponse.json({ error: "No password set" }, { status: 400 })
        }
        const isValid = await bcrypt.compare(password, user.password)
        return NextResponse.json({ valid: isValid, fallback: true })
      }

      const isValid = await bcrypt.compare(password, user.vaultPassword)
      return NextResponse.json({ valid: isValid, fallback: false })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Vault password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { vaultPassword: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ hasVaultPassword: !!user.vaultPassword })
  } catch (error) {
    console.error("Check vault password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}