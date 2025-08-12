import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

function linkId(studioId, instructorId) { return `${studioId}_${instructorId}` }

export async function POST(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { instructorId, proposedRate, currency = 'USD', cancelFeeCents = 0, noShowFeeCents = 0, classId = null, note = '' } = await request.json()
    if (!instructorId) return NextResponse.json({ error: 'instructorId required' }, { status: 400 })

    const id = linkId(user.uid, instructorId)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const data = {
      studioId: user.uid,
      instructorId,
      status: 'invited',
      proposedRate: Number(proposedRate) || 0,
      currency,
      cancelFeeCents: Number(cancelFeeCents) || 0,
      noShowFeeCents: Number(noShowFeeCents) || 0,
      note,
      classId,
      expiresAt,
      createdAt: now,
      updatedAt: now
    }
    await adminDb.collection('studio_instructor_links').doc(id).set(data, { merge: true })

    // TODO: auto-create messaging thread via existing server-api if needed

    return NextResponse.json({ id, ...data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}


