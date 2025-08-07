import { NextResponse } from 'next/server'
import { getFirebaseUser } from '@/lib/firebase-admin'

export async function GET(request) {
  try {
    // Verify Firebase authentication
    const firebaseUser = await getFirebaseUser(request)
    if (!firebaseUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, return empty dashboard data structure
    // This will show proper empty states in the UI
    const dashboardData = {
      overview: {
        totalClasses: 0,
        upcomingClasses: 0,
        totalStudents: 0,
        totalEarnings: 0,
        weeklyEarnings: 0,
        averageRating: 0,
        totalReviews: 0
      },
      instructor: {
        name: 'Instructor',
        bio: 'Bio not set',
        specialties: [],
        experience: 'Experience not set',
        createdBy: firebaseUser.uid
      },
      classes: [],
      upcomingClasses: [],
      students: [],
      bookings: [],
      reviews: [],
      recentActivity: []
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