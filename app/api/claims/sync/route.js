import { NextResponse } from 'next/server'
import { verifySessionCookie, setCustomUserClaims } from '@/lib/firebase-admin'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import app from '@/lib/firebase'

const db = getFirestore(app)

function normalizeRole(role) {
  if (!role) return null
  if (role === 'studio-owner' || role === 'studio') return 'merchant'
  return role
}

export async function POST(request) {
  try {
    const sessionCookie = request.cookies.get('session')?.value
    if (!sessionCookie) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const verifyResult = await verifySessionCookie(sessionCookie)
    if (!verifyResult.success) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const uid = verifyResult.decodedClaims.uid

    // Try profiles first
    let snap = await getDoc(doc(db, 'profiles', uid))
    if (!snap.exists()) {
      // fallback to users
      snap = await getDoc(doc(db, 'users', uid))
      if (!snap.exists()) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
      }
    }

    const data = snap.data() || {}
    const role = normalizeRole(data.role)
    const onboardingComplete = !!(data.onboardingComplete || data.onboarding_complete)

    const claims = await setCustomUserClaims(uid, { role, onboardingComplete })
    if (!claims.success) return NextResponse.json({ error: 'Failed to set custom claims' }, { status: 500 })

    return NextResponse.json({ success: true, role, onboardingComplete })
  } catch (error) {
    console.error('Claims sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


