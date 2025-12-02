import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db-helpers"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }
    
    console.log('Testing auth database query for email:', email)
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Database URL configured:', !!process.env.DATABASE_URL)
    console.log('Direct URL configured:', !!process.env.DIRECT_URL)
    
    // This is the same query that the auth system would make
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    return NextResponse.json({
      success: true,
      userFound: !!user,
      userId: user?.id || null,
      environment: process.env.NODE_ENV,
      message: "Database query successful"
    })
    
  } catch (error: any) {
    console.error('Auth test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      environment: process.env.NODE_ENV,
      isSSLError: error.message?.includes('certificate') || error.message?.includes('SSL'),
      fullError: {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n') // First 5 lines only
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Use POST with { email: 'test@example.com' } to test auth database connection",
    environment: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasDirect: !!process.env.DIRECT_URL
  })
}