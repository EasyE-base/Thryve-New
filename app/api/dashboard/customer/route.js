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
        totalBookings: 0,
        upcomingBookings: 0,
        pastBookings: 0,
        totalSpent: 0,
        favoriteStudios: 0,
        totalClasses: 0
      },
      customer: {
        name: 'Customer',
        goals: [],
        preferences: [],
        createdBy: 'user-id'
      },
      bookings: [],
      upcomingBookings: [],
      pastBookings: [],
      classes: [],
      favoriteStudios: [],
      recentActivity: []
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Customer dashboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 })
  }
} 