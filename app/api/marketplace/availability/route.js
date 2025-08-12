import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const snap = await adminDb.collection('instructors').doc(user.uid).collection('availability').get()
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ availability: items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load availability' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { availability } = await request.json()
    if (!Array.isArray(availability)) return NextResponse.json({ error: 'Invalid availability' }, { status: 400 })

    const col = adminDb.collection('instructors').doc(user.uid).collection('availability')
    const existing = await col.get()
    const batch = adminDb.batch()
    existing.forEach(doc => batch.delete(doc.ref))
    availability.forEach((item) => {
      const ref = col.doc()
      batch.set(ref, item)
    })
    await batch.commit()
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
  }
}


