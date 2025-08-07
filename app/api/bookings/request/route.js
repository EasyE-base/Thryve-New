import { NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const { auth, db } = initAdmin()
    const decodedToken = await auth.verifyIdToken(idToken)

    // Get user data to verify they're a studio
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.exists ? userDoc.data() : null

    if (!userData || userData.role !== 'studio') {
      return NextResponse.json({ error: 'Only studios can send booking requests' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      instructorId,
      instructorName,
      instructorEmail,
      classType,
      scheduledTime,
      duration,
      location,
      maxStudents,
      proposedRate,
      specialRequirements = ''
    } = body

    // Validate required fields
    if (!instructorId || !classType || !scheduledTime || !proposedRate) {
      return NextResponse.json({ 
        error: 'Missing required fields: instructorId, classType, scheduledTime, proposedRate' 
      }, { status: 400 })
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledTime)
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ 
        error: 'Scheduled time must be in the future' 
      }, { status: 400 })
    }

    // Validate proposed rate is reasonable
    if (proposedRate < 20 || proposedRate > 500) {
      return NextResponse.json({ 
        error: 'Proposed rate must be between $20 and $500' 
      }, { status: 400 })
    }

    // Create booking request
    const bookingRequest = {
      instructorId,
      instructorName,
      instructorEmail,
      classType,
      scheduledTime: scheduledDate,
      duration: duration || 60,
      location: location || 'Studio Location',
      maxStudents: maxStudents || 20,
      proposedRate,
      specialRequirements,
      status: 'pending',
      createdAt: new Date(),
      respondedAt: null,
      instructorResponse: '',
      paymentStatus: 'pending',
      escrowAmount: proposedRate,
      thryveCommission: proposedRate * 0.10,
      instructorPayout: proposedRate * 0.90
    }

    // Add to Firestore (simulated for Phase 1)
    // In production, this would be: await db.collection(`studios/${decodedToken.uid}/bookingRequests`).add(bookingRequest)
    
    // For Phase 1, we'll simulate the database operation
    const requestId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Mock successful creation
    console.log('Booking request created:', {
      requestId,
      studioId: decodedToken.uid,
      ...bookingRequest
    })

    // In Phase 2, we would also:
    // 1. Create payment intent with Stripe
    // 2. Send email notification to instructor
    // 3. Create instructor's view of the booking request
    // 4. Update marketplace stats

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Booking request sent successfully',
      booking: {
        id: requestId,
        ...bookingRequest
      }
    })

  } catch (error) {
    console.error('Booking request error:', error)
    return NextResponse.json({ 
      error: 'Failed to send booking request',
      details: error.message 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const idToken = authHeader.split('Bearer ')[1]
    if (!idToken) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    const { auth, db } = initAdmin()
    const decodedToken = await auth.verifyIdToken(idToken)

    // Get user data
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    const userData = userDoc.exists ? userDoc.data() : null

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get booking requests based on user role
    let bookingRequests = []

    if (userData.role === 'studio') {
      // Studios can see their outgoing booking requests
      // In production: const snapshot = await db.collection(`studios/${decodedToken.uid}/bookingRequests`).get()
      
      // Mock data for Phase 1
      bookingRequests = [
        {
          id: 'booking-1',
          instructorId: 'instructor-1',
          instructorName: 'Sarah Johnson',
          classType: 'Yoga',
          scheduledTime: new Date('2024-01-15T10:00:00Z'),
          proposedRate: 85,
          status: 'pending',
          createdAt: new Date('2024-01-10T14:30:00Z')
        },
        {
          id: 'booking-2',
          instructorId: 'instructor-2',
          instructorName: 'Mike Rodriguez',
          classType: 'HIIT',
          scheduledTime: new Date('2024-01-16T18:00:00Z'),
          proposedRate: 95,
          status: 'accepted',
          createdAt: new Date('2024-01-08T09:15:00Z')
        }
      ]
    } else if (userData.role === 'instructor') {
      // Instructors can see incoming booking requests
      // In production: const snapshot = await db.collection(`users/${decodedToken.uid}/bookingRequests`).get()
      
      // Mock data for Phase 1
      bookingRequests = [
        {
          id: 'booking-3',
          studioId: 'studio-1',
          studioName: 'Fitness Studio LA',
          classType: 'Yoga',
          scheduledTime: new Date('2024-01-15T10:00:00Z'),
          proposedRate: 85,
          status: 'pending',
          receivedAt: new Date('2024-01-10T14:30:00Z')
        }
      ]
    }

    return NextResponse.json({
      bookingRequests,
      total: bookingRequests.length
    })

  } catch (error) {
    console.error('Get booking requests error:', error)
    return NextResponse.json({ 
      error: 'Failed to get booking requests',
      details: error.message 
    }, { status: 500 })
  }
}
