import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const WORK_SUBDOMAIN_PREFIX = 'work.'
const WORK_ROUTE_PREFIX = '/work'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const {pathname} = request.nextUrl
  const isWorkHost = hostname.startsWith(WORK_SUBDOMAIN_PREFIX)
  const isWorkPath = pathname === WORK_ROUTE_PREFIX || pathname.startsWith(`${WORK_ROUTE_PREFIX}/`)

  if (isWorkHost) {
    if (isWorkPath) {
      // Someone hit work.sukhov.xyz/work directly — keep the internal
      // route hidden and treat it like any other unknown path.
      return NextResponse.rewrite(new URL('/work-not-found', request.url))
    }
    return NextResponse.rewrite(new URL(`${WORK_ROUTE_PREFIX}${pathname}`, request.url))
  }

  if (isWorkPath) {
    // Don't let the work site leak through on the main domain.
    return NextResponse.rewrite(new URL('/work-not-found', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|api|monitoring).*)',
  ],
}
