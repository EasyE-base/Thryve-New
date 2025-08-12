import { NextResponse } from 'next/server'
import { getFirebaseUser } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Fetch instructor profile and related data
    const { getFirestore } = await import('firebase-admin/firestore')
    const db = getFirestore()
    const profileSnap = await db.collection('instructors').doc(firebaseUser.uid).get()
    const profile = profileSnap.exists ? profileSnap.data() : null

    const classesSnap = await db.collection('classes')
      .where('instructorId', '==', firebaseUser.uid)
      .limit(50).get()
    const classes = classesSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const bookingsSnap = await db.collection('bookings')
      .where('instructorId', '==', firebaseUser.uid)
      .limit(50).get()
    const bookings = bookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }))

    const upcoming = classes
      .sort((a,b) => (new Date(a.startTime || 0)) - (new Date(b.startTime || 0)))
      .filter(c => c.startTime && Date.now() <= new Date(c.startTime).getTime())
    const overview = {
      totalClasses: classes.length,
      upcomingClasses: upcoming.length,
      totalStudents: null,
      totalEarnings: null,
      weeklyEarnings: null,
      averageRating: null,
      totalReviews: null
    }

    const dashboardData = {
      overview,
      instructor: profile ? {
        name: profile.displayName ?? null,
        bio: profile.bio ?? null,
        specialties: profile.specialties ?? [],
        experience: profile.experience ?? null
      } : null,
      classes,
      upcomingClasses: upcoming,
      students: [],
      bookings,
      reviews: [],
      recentActivity: bookings
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Instructor dashboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 })
  }
} 