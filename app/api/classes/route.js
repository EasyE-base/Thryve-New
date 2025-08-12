import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (!start || !end) return NextResponse.json({ classes: [] })

    const snap = await adminDb.collection('classes')
      .where('studioId', '==', firebaseUser.uid)
      .where('startTime', '>=', start)
      .where('startTime', '<=', end)
      .limit(500)
      .get()

    const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ classes })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}


