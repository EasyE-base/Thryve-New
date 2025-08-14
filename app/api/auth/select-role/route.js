export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { initAdmin, verifySessionCookie } from '@/lib/firebase-admin'

export async function POST(req) {
  try {
    let body = null
    try {
      body = await req.json()
    } catch (_e) {
      body = null
    }

    const inputRole = ((body && body.role) || '').toString().trim().toLowerCase()
    const roleMap = { studio: 'merchant', merchant: 'merchant', instructor: 'instructor', customer: 'customer' }
    const role = roleMap[inputRole]

    if (!role) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const session = cookies().get('session')?.value
    if (!session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const verified = await verifySessionCookie(session)
    if (!verified?.success || !verified.decodedClaims?.uid) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const uid = verified.decodedClaims.uid

    const { db } = initAdmin()
    await db.collection('profiles').doc(uid).set(
      { role, onboardingComplete: false, updatedAt: new Date() },
      { merge: true }
    )

    return NextResponse.json({ role, redirect: `/onboarding/${role}` })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}


