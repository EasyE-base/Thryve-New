import { NextResponse } from 'next/server'
import { getFirebaseUser, initAdmin } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    const { db } = initAdmin()
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const url = new URL(request.url)
    const role = url.searchParams.get('role') // 'merchant' | 'instructor'
    const status = url.searchParams.get('status') // optional

    let query = db.collection('studio_instructor_links')
    if (role === 'merchant') {
      query = query.where('studioId', '==', user.uid)
    } else if (role === 'instructor') {
      query = query.where('instructorId', '==', user.uid)
    } else {
      return NextResponse.json({ error: 'role required' }, { status: 400 })
    }
    if (status) query = query.where('status', '==', status)
    const snap = await query.limit(100).get()
    const now = Date.now()
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .map(x => ({ ...x, isExpired: x.expiresAt ? (new Date(x.expiresAt).getTime() < now) : false }))
    return NextResponse.json({ invites: items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load invites' }, { status: 500 })
  }
}


