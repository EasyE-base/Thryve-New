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

async function getClassDoc(classId) {
  const ref = adminDb.collection('classes').doc(classId)
  const snap = await ref.get()
  return { ref, snap }
}

export async function PUT(request, { params }) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { id } = params
    const { ref, snap } = await getClassDoc(id)
    if (!snap.exists) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    const cls = snap.data()

    const body = sanitize(await request.json())

    const isStudioOwner = cls.studioId === firebaseUser.uid
    const isAssignedInstructor = cls.instructorId && cls.instructorId === firebaseUser.uid

    if (!isStudioOwner && !isAssignedInstructor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let allowedUpdate = {}
    if (isStudioOwner) {
      // Full control except studioId
      const { studioId, booked, createdAt, ...rest } = body
      allowedUpdate = rest
    } else if (isAssignedInstructor) {
      // Only time/notes
      const { startTime, endTime, notes } = body
      allowedUpdate = {}
      if (startTime) allowedUpdate.startTime = startTime
      if (endTime) allowedUpdate.endTime = endTime
      if (notes) allowedUpdate.notes = notes
    }

    if (Object.keys(allowedUpdate).length === 0) {
      return NextResponse.json({ error: 'No permitted fields to update' }, { status: 400 })
    }

    allowedUpdate.updatedAt = new Date().toISOString()
    await ref.set(allowedUpdate, { merge: true })
    return NextResponse.json({ id, ...cls, ...allowedUpdate })
  } catch (e) {
    console.error('Update class error:', e)
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { id } = params
    const { ref, snap } = await getClassDoc(id)
    if (!snap.exists) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    const cls = snap.data()

    if (cls.studioId !== firebaseUser.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await ref.delete()
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete class error:', e)
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 })
  }
}


