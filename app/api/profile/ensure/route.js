// app/api/profile/ensure/route.js
import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request) {
  const authz = request.headers.get('authorization') || ''
  if (!authz.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'NO_TOKEN' }, { status: 401 })
  }

  try {
    const idToken = authz.slice(7)
    const { auth, db } = initAdmin()
    const decoded = await auth.verifyIdToken(idToken)
    const uid = decoded.uid

    const profRef = db.collection('profiles').doc(uid)
    const profSnap = await profRef.get()
    if (profSnap.exists) {
      return NextResponse.json({ ok: true, created: false, profile: profSnap.data() })
    }

    // Fallback: try legacy users collection for role
    const userSnap = await db.collection('users').doc(uid).get()
    const rawRole = ((userSnap.data()?.role) || '').toString().toLowerCase()
    const allowed = ['merchant','studio','studio-owner','instructor','customer']
    const role = allowed.includes(rawRole) ? rawRole : 'customer'

    const profile = {
      role,
      onboardingComplete: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }

    await profRef.set(profile, { merge: true })
    return NextResponse.json({ ok: true, created: true, profile })
  } catch (e) {
    return NextResponse.json({ error: 'INVALID_TOKEN', details: e?.message || 'unknown' }, { status: 401 })
  }
}


