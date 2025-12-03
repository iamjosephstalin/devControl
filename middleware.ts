import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Simple page access control without database calls
const pageAccess = {
  admin: [
    '/', '/projects', '/tasks', '/secrets', '/servers', '/notes', 
    '/integrations', '/deployments', '/users', '/settings', '/infrastructure',
    '/version-control', '/schedule', '/profile'
  ],
  client: [
    '/projects', '/tasks', '/notes', '/profile', '/schedule'
  ]
}

function canAccessPage(role: string, pathname: string): boolean {
  const allowedPages = pageAccess[role as keyof typeof pageAccess] || []
  
  // Check exact match first
  if (allowedPages.includes(pathname)) {
    return true
  }
  
  // Check if it's a dynamic route that user has access to
  for (const allowedPage of allowedPages) {
    if (allowedPage.includes('[') || pathname.startsWith(allowedPage.replace(/\[[^\]]*\]/g, ''))) {
      return true
    }
  }
  
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Special handling for login page - redirect authenticated users away
  if (pathname === "/login") {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    })
    
    if (token) {
      // Redirect authenticated users away from login page
      const role = token.role as string
      const dashboardUrl = role === "client" ? "/projects" : "/"
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }
    
    return NextResponse.next()
  }

  // Allow access to signup, static files, and API routes without auth
  if (
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next()
  }

  // For API routes (except auth), check session but don't redirect
  if (pathname.startsWith("/api")) {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
    })
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    return NextResponse.next()
  }

  // For all other routes, validate session and redirect if not authenticated
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  })

  if (!token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if user has access to this page based on their role
  const userRole = (token.role as string) || 'client'
  if (!canAccessPage(userRole as 'admin' | 'client', pathname)) {
    console.log(`🚫 Access denied: ${userRole} trying to access ${pathname}`)
    
    // Redirect to appropriate dashboard based on role
    const dashboardUrl = userRole === 'admin' ? '/' : '/projects'
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled above)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}

