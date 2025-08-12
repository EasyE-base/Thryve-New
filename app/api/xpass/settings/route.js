import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

const DEFAULT_SETTINGS = (studioId) => ({
  studioId,
  xpassEnabled: false,
  acceptedClassTypes: [],
  cancellationWindow: 2,
  noShowFee: 15,
  lateCancelFee: 10,
  platformFeeRate: 0.05,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

async function resolveUserRole(uid) {
  try {
    const profilesSnap = await adminDb.collection('profiles').doc(uid).get()
    const usersSnap = await adminDb.collection('users').doc(uid).get()
    const role = profilesSnap.exists ? profilesSnap.data().role : (usersSnap.exists ? usersSnap.data().role : null)
    return role || null
  } catch {
    return null
  }
}

export async function GET(request) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const docRef = adminDb.collection('studio_xpass_settings').doc(firebaseUser.uid)
    const snap = await docRef.get()

    if (!snap.exists) {
      return NextResponse.json(DEFAULT_SETTINGS(firebaseUser.uid))
    }

    return NextResponse.json(snap.data())
  } catch (error) {
    console.error('GET /api/xpass/settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch X Pass settings' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const role = await resolveUserRole(firebaseUser.uid)
    if (!['merchant', 'studio-owner'].includes(role)) {
      return NextResponse.json({ error: 'Studio access required' }, { status: 403 })
    }

    const body = await request.json()
    const allowed = {
      xpassEnabled: typeof body.xpassEnabled === 'boolean' ? body.xpassEnabled : undefined,
      acceptedClassTypes: Array.isArray(body.acceptedClassTypes) ? body.acceptedClassTypes : undefined,
      cancellationWindow: typeof body.cancellationWindow === 'number' ? body.cancellationWindow : undefined,
      noShowFee: typeof body.noShowFee === 'number' ? body.noShowFee : undefined,
      lateCancelFee: typeof body.lateCancelFee === 'number' ? body.lateCancelFee : undefined
    }

    // Remove undefined fields
    Object.keys(allowed).forEach((k) => allowed[k] === undefined && delete allowed[k])

    const nowIso = new Date().toISOString()

    const docRef = adminDb.collection('studio_xpass_settings').doc(firebaseUser.uid)
    const snap = await docRef.get()
    if (!snap.exists) {
      const newDoc = { ...DEFAULT_SETTINGS(firebaseUser.uid), ...allowed, createdAt: nowIso, updatedAt: nowIso }
      await docRef.set(newDoc)
      return NextResponse.json(newDoc)
    } else {
      const updated = { ...snap.data(), ...allowed, updatedAt: nowIso }
      await docRef.set(updated, { merge: true })
      return NextResponse.json(updated)
    }
  } catch (error) {
    console.error('PUT /api/xpass/settings error:', error)
    return NextResponse.json({ error: 'Failed to update X Pass settings' }, { status: 500 })
  }
}


