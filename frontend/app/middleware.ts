import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting setup
const rateLimitMap = new Map();

export function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  // Clean old entries
  for (const [key, timestamp] of rateLimitMap.entries()) {
    if (now - timestamp > windowMs) {
      rateLimitMap.delete(key);
    }
  }

  const userRequests = Array.from(rateLimitMap.entries())
    .filter(([key]) => key.startsWith(ip))
    .length;

  if (userRequests >= maxRequests) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  rateLimitMap.set(`${ip}-${now}`, now);

  return NextResponse.next();
}

export const config = {
  matcher: '/api/relay/:path*',
};