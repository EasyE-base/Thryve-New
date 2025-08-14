// app/api/session/sync/route.js
import { NextResponse } from 'next/server'
import { verifyIdToken, createSessionCookie, verifySessionCookie } from '@/lib/firebase-admin'

export async function POST(request) {
  try {
    const { idToken, clear } = await request.json()
    if (clear) {
      const res = NextResponse.json({ success: true, cleared: true })
      res.cookies.delete('session')
      return res
    }
    if (!idToken) return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
    const verifyResult = await verifyIdToken(idToken)
    if (!verifyResult.success) return NextResponse.json({ error: 'Invalid ID token' }, { status: 401 })
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const session = await createSessionCookie(idToken, expiresIn)
    if (!session.success) return NextResponse.json({ error: 'Failed to create session cookie' }, { status: 500 })
    const res = NextResponse.json({ success: true, uid: verifyResult.decodedToken.uid, email: verifyResult.decodedToken.email })
    const isProduction = process.env.NODE_ENV === 'production'
    res.cookies.set('session', session.sessionCookie, { maxAge: expiresIn / 1000, httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' })
    return res
  } catch (e) {
    console.error('Session sync error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) return NextResponse.json({ error: 'No session cookie' }, { status: 401 })
    const verifyResult = await verifySessionCookie(sessionCookie)
    if (!verifyResult.success) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    const { decodedClaims } = verifyResult
    return NextResponse.json({ success: true, uid: decodedClaims.uid, email: decodedClaims.email, role: decodedClaims.role, onboardingComplete: decodedClaims.onboardingComplete })
  } catch (error) {
    console.error('Session get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


