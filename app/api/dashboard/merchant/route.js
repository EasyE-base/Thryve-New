import { NextResponse } from 'next/server'
import { getFirebaseUser, adminDb } from '@/lib/firebase-admin'

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
        totalInstructors: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        totalBookings: 0,
        averageRating: 0
      },
      merchant: {
        name: 'Studio Owner',
        studioName: 'Studio Name',
        createdBy: firebaseUser.uid
      },
      classes: [],
      instructors: [],
      bookings: [],
      revenue: [],
      recentActivity: []
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