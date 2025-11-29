import { NextRequest, NextResponse } from "next/server"
// import { prisma } from "@/lib/db"
// import bcrypt from "bcryptjs"

// Signup is disabled - users are created by admins from the settings page
// This will be re-enabled for SaaS mode
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Signup is disabled. Please contact an administrator to create your account." },
    { status: 403 }
  )
  
  /* 
  // First user becomes admin automatically
  const userCount = await prisma.user.count()
  const isFirstUser = userCount === 0
  */
  
  /* SaaS Mode - Uncomment for public signup
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: "client", // Default role for signups
      },
    })

    // Don't send password back
    const { password: _, ...safeUser } = user

    return NextResponse.json(safeUser, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
  */
}

