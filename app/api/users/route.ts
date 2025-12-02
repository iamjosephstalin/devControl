import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions, validateSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = await validateSessionUser(session?.user?.id)
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Unauthorized. Please log out and log back in." 
      }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get all users with basic info
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    })

    // Fetch creator info for users who have a creator
    const usersWithCreator = await Promise.all(
      users.map(async (user) => {
        if (user.createdBy) {
          const creator = await prisma.user.findUnique({
            where: { id: user.createdBy }
          })
          return {
            ...user,
            creator,
          }
        }
        return {
          ...user,
          creator: null,
        }
      })
    )

    return NextResponse.json(usersWithCreator)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if this is the first user - allow creation without auth
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // If not first user, require authentication and admin role
    if (!isFirstUser) {
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      // Check if user is admin
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      })

      if (currentUser?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const body = await request.json()
    const { email, password, name, role } = body

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

    // Get the current user ID for createdBy field
    const currentUserId = isFirstUser ? null : (session?.user?.id || null)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: isFirstUser ? "admin" : (role || "client"),
        createdBy: currentUserId,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    )
  }
}

