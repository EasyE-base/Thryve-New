import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch real data from Firestore with safe defaults
    const studioRef = adminDb.collection('studios').doc(firebaseUser.uid)
    const studioSnap = await studioRef.get()
    const studio = studioSnap.exists ? studioSnap.data() : null

    // Avoid composite index requirement: fetch by studioId and sort in memory
    const classesSnap = await adminDb.collection('classes')
      .where('studioId', '==', firebaseUser.uid)
      .limit(50).get()
    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (new Date(b.startTime || 0)) - (new Date(a.startTime || 0)))

    const bookingsSnap = await adminDb.collection('bookings')
      .where('studioId', '==', firebaseUser.uid)
      .limit(50).get()
    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (new Date(b.createdAt || 0)) - (new Date(a.createdAt || 0)))

    const instructorsSnap = await adminDb.collection('studio_staff')
      .where('studioId', '==', firebaseUser.uid).get()
    const instructors = instructorsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const totalBookings = bookings.length
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    const overview = {
      totalClasses: classes.length,
      totalInstructors: instructors.length,
      totalRevenue: null, // compute via payments if available
      monthlyRevenue: null,
      totalBookings,
      averageRating: null
    }

    const dashboardData = {
      overview,
      studio: studio ? {
        name: studio.name ?? null,
        type: studio.type ?? null,
        location: studio.location ?? null
      } : null,
      classes,
      instructors,
      bookings,
      revenue: [],
      recentActivity: bookings
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Merchant dashboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 })
  }
} 