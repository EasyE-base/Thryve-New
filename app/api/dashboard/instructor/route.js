import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // Verify authentication header exists
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
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
        createdBy: 'user-id'
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