import { NextResponse } from 'next/server'
import { getFirebaseUser, initAdmin } from '@/lib/firebase-admin'

const ALLOWED_FIELDS = [
  'displayName','avatarUrl','bio','specialties','certifications','yearsExperience',
  'hourlyRate','currency','minSessionMinutes','remoteAvailable','travelRadiusKm',
  'languages','timezone','homeLocation','lat','lng','marketplaceVisible','verified'
]

function sanitize(input) {
  if (input == null || typeof input !== 'object') return input
  const out = Array.isArray(input) ? [] : {}
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue
    out[k] = sanitize(v)
  }
  return out
}

export async function GET(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { db } = initAdmin()
    const doc = await db.collection('instructors').doc(user.uid).get()
    return NextResponse.json(doc.exists ? doc.data() : {})
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const body = sanitize(await request.json())
    const update = {}
    for (const k of ALLOWED_FIELDS) if (k in body) update[k] = body[k]
    update.updatedAt = new Date().toISOString()
    if (!update.currency) update.currency = 'USD'

    const { db } = initAdmin()
    await db.collection('instructors').doc(user.uid).set(update, { merge: true })
    const saved = await db.collection('instructors').doc(user.uid).get()
    return NextResponse.json(saved.data())
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}


