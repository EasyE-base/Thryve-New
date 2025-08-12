import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

function sanitize(input) {
  if (input == null || typeof input !== 'object') return input
  const out = Array.isArray(input) ? [] : {}
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined) continue
    out[k] = sanitize(v)
  }
  return out
}

export async function POST(request) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const nowIso = new Date().toISOString()

    // Enforce single-studio per owner: studioId must be caller uid
    const newClass = sanitize({
      studioId: firebaseUser.uid,
      instructorId: body.instructorId ?? null,
      name: body.name || 'Class',
      type: body.type || null,
      startTime: body.startTime,
      endTime: body.endTime,
      capacity: typeof body.capacity === 'number' ? body.capacity : 10,
      booked: 0,
      status: 'scheduled',
      room: body.room || null,
      createdAt: nowIso,
      updatedAt: nowIso
    })

    if (!newClass.startTime || !newClass.endTime) {
      return NextResponse.json({ error: 'startTime and endTime are required' }, { status: 400 })
    }

    // Optional: verify studio exists and owned by user
    // const studioSnap = await adminDb.collection('studios').doc(firebaseUser.uid).get()
    // if (!studioSnap.exists) return NextResponse.json({ error: 'Studio not found' }, { status: 403 })

    const docRef = await adminDb.collection('classes').add(newClass)
    const created = { id: docRef.id, ...newClass }
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
  }
}

