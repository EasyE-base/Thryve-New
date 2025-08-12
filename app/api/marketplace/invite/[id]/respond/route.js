import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

export async function POST(request, { params }) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { id } = params
    const { accept } = await request.json()
    if (!id || !id.endsWith(`_${user.uid}`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const ref = adminDb.collection('studio_instructor_links').doc(id)
    const snap = await ref.get()
    if (!snap.exists) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    const now = new Date()
    const data = { status: accept ? 'active' : 'rejected', updatedAt: now }
    await ref.set(data, { merge: true })
    return NextResponse.json({ success: true, ...data })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to respond to invite' }, { status: 500 })
  }
}


