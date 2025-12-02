import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/postgres"

export async function GET(request: NextRequest) {
  // Allow debug endpoint in production for troubleshooting
  // Add a simple debug key check for security
  const debugKey = request.nextUrl.searchParams.get('key')
  if (process.env.NODE_ENV === 'production' && debugKey !== 'debug-ssl-2024') {
    return NextResponse.json({ error: "Debug key required in production" }, { status: 401 })
  }

  try {
    console.log('Testing SSL database connection...')
    console.log('Environment:', process.env.NODE_ENV)
    
    const result = await query('SELECT NOW() as current_time, version() as postgres_version')
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      data: result.rows[0],
      environment: process.env.NODE_ENV,
      hasDirectUrl: !!process.env.DIRECT_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('SSL Test Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      environment: process.env.NODE_ENV,
      isSSLError: error.message?.includes('certificate') || error.message?.includes('SSL'),
      timestamp: new Date().toISOString(),
      details: {
        name: error.name,
        code: error.code,
        routine: error.routine,
        constraint: error.constraint
      }
    }, { status: 500 })
  }
}