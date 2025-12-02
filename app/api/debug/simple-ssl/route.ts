import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Simple check without any database query - just to see if the endpoint works
  return NextResponse.json({
    message: "Debug endpoint is working",
    environment: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasDirect: !!process.env.DIRECT_URL,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
    timestamp: new Date().toISOString()
  })
}