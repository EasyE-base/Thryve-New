import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'No authorization header',
        authenticated: false 
      })
    }

    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'No token provided',
        authenticated: false 
      })
    }

    try {
      const { auth } = initAdmin()
      const decodedToken = await auth.verifyIdToken(token)
      return NextResponse.json({
        authenticated: true,
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified
        },
        tokenInfo: {
          issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
          expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
          isExpired: Date.now() > decodedToken.exp * 1000
        }
      })
    } catch (tokenError) {
      return NextResponse.json({
        error: 'Invalid token',
        details: tokenError.message,
        authenticated: false
      })
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Authentication check failed',
      details: error.message,
      authenticated: false
    })
  }
}
