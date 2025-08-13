import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'
import { latitudeRange, haversineMiles } from '@/lib/geo'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lng = parseFloat(searchParams.get('lng') || '0')
  const radius = parseFloat(searchParams.get('radius') || '25')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
  const cursor = searchParams.get('cursor')

  if (!isFinite(lat) || !isFinite(lng)) return NextResponse.json({ items: [], nextCursor: null })
  const { minLat, maxLat } = latitudeRange(lat, radius)
  const { db } = initAdmin()

  try {
    let query = db.collection('classes')
      .where('status', '==', 'published')
      .where('lat', '>=', minLat)
      .where('lat', '<=', maxLat)
      .orderBy('lat', 'asc')
      .limit(limit)

    if (cursor) {
      const snap = await db.collection('classes').doc(cursor).get()
      if (snap.exists) {
        query = query.startAfter(snap.get('lat'))
      }
    }

    const snap = await query.get()
    const items = []
    for (const doc of snap.docs) {
      const data = doc.data()
      if (typeof data.lat !== 'number' || typeof data.lng !== 'number') continue
      const dist = haversineMiles(lat, lng, data.lat, data.lng)
      if (dist <= radius) {
        items.push({ id: doc.id, ...data })
      }
    }
    // Sort by startTime ascending
    items.sort((a, b) => (a.startTime || 0) - (b.startTime || 0))

    const nextCursor = snap.size === limit ? snap.docs[snap.docs.length - 1].id : null
    return NextResponse.json({ items, nextCursor })
  } catch (e) {
    return NextResponse.json({ items: [], nextCursor: null })
  }
}


