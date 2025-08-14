import { NextResponse } from 'next/server'
import { getFirebaseUser, initAdmin } from '@/lib/firebase-admin'

function linkId(studioId, instructorId) { return `${studioId}_${instructorId}` }

export async function POST(request) {
  try {
    const { db } = initAdmin()
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { instructorId, proposedRate, currency = 'USD', cancelFeeCents = 0, noShowFeeCents = 0, classId = null, note = '' } = await request.json()
    if (!instructorId) return NextResponse.json({ error: 'instructorId required' }, { status: 400 })

    const id = linkId(user.uid, instructorId)
    const now = new Date()
    const data = {
      studioId: user.uid,
      instructorId,
      status: 'invited',
      proposedRate: Math.min(Math.max(Number(proposedRate) || 0, 10), 500),
      currency,
      cancelFeeCents: Math.max(Number(cancelFeeCents) || 0, 0),
      noShowFeeCents: Math.max(Number(noShowFeeCents) || 0, 0),
      note,
      classId,
      expiresAt: now,
      createdAt: now,
      updatedAt: now
    }
    const ref = db.collection('studio_instructor_links').doc(id)
    const existing = await ref.get()
    if (existing.exists) {
      const cur = existing.data()
      if (cur.status === 'invited' || cur.status === 'active') {
        return NextResponse.json({ error: 'Invite already exists' }, { status: 409 })
      }
    }
    await ref.set(data, { merge: true })

    // TODO: auto-create messaging thread via existing server-api if needed

    return NextResponse.json({ id, ...data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}


