import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  const headers = response.headers
  
  // Protect against XSS attacks
  headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')
  
  // Control iframe embedding
  headers.set('X-Frame-Options', 'DENY')
  
  // Enable strict CSP
  headers.set(
    'Content-Security-Policy',
    `default-src 'self';` +
    `script-src 'self' 'unsafe-eval' 'unsafe-inline';` +
    `style-src 'self' 'unsafe-inline';` +
    `img-src 'self' https:;` +
    `frame-src 'self' https://www.youtube.com;` +
    `connect-src 'self';`
  )

  return response
}

export const config = {
  matcher: '/:path*',
}
