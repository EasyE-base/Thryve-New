import { NextResponse } from 'next/server'
import { getFirebaseUser, initAdmin } from '@/lib/firebase-admin'

export async function PUT(request, { params }) {
  try {
    const { db } = initAdmin()
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { id } = params
    if (!id || !id.startsWith(`${user.uid}_`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.collection('studio_instructor_links').doc(id).set({ status: 'blocked', updatedAt: new Date() }, { merge: true })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to withdraw invite' }, { status: 500 })
  }
}


