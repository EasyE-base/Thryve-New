import { NextResponse } from 'next/server'
import { getFirebaseUser, initAdmin } from '@/lib/firebase-admin'

export async function PUT(request) {
  try {
    const user = await getFirebaseUser(request)
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const { marketplaceVisible } = await request.json()
    const { db } = initAdmin()
    await db.collection('instructors').doc(user.uid).set({ marketplaceVisible: !!marketplaceVisible, updatedAt: new Date().toISOString() }, { merge: true })
    return NextResponse.json({ marketplaceVisible: !!marketplaceVisible })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 })
  }
}


