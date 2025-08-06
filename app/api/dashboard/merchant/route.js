import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export async function GET(request) {
  try {
    // Verify authentication header exists
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 })
    }

    // For now, we'll extract user ID from a simple token
    // In production, you'd verify the Firebase ID token
    const token = authHeader.split('Bearer ')[1]
    
    // Try to get user from Firebase using the current user session
    // For now, we'll use a placeholder approach since we don't have Firebase Admin set up
    let userId = 'current-user' // This would be extracted from the verified token
    
    try {
      // Get studio data
      const studioDoc = await getDoc(doc(db, 'studios', userId))
      const studioData = studioDoc.exists() ? studioDoc.data() : null

      // Get classes for this studio
      const classesQuery = query(collection(db, 'classes'), where('studioId', '==', userId))
      const classesSnapshot = await getDocs(classesQuery)
      const classes = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Get instructors for this studio
      const instructorsQuery = query(collection(db, 'users'), where('role', '==', 'instructor'))
      const instructorsSnapshot = await getDocs(instructorsQuery)
      const instructors = instructorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Get bookings for this studio
      const bookingsQuery = query(collection(db, 'bookings'), where('studioId', '==', userId))
      const bookingsSnapshot = await getDocs(bookingsQuery)
      const bookings = bookingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Calculate revenue from bookings
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
      const confirmedBookings = bookings.filter(booking => booking.status === 'confirmed')
      const confirmedRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)

      // Get unique customers
      const uniqueCustomerIds = [...new Set(bookings.map(booking => booking.userId))]
      const customersQuery = query(collection(db, 'users'), where('role', '==', 'customer'))
      const customersSnapshot = await getDocs(customersQuery)
      const customers = customersSnapshot.docs
        .filter(doc => uniqueCustomerIds.includes(doc.id))
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))

      // Prepare dashboard data
      const dashboardData = {
        overview: {
          totalClasses: classes.length,
          totalInstructors: instructors.length,
          totalCustomers: customers.length,
          totalRevenue: totalRevenue,
          confirmedRevenue: confirmedRevenue,
          totalBookings: bookings.length,
          confirmedBookings: confirmedBookings.length
        },
        studio: studioData || {
          name: 'Your Studio',
          location: 'Location not set',
          type: 'Fitness Studio',
          amenities: [],
          createdBy: userId
        },
        classes: classes,
        instructors: instructors,
        customers: customers,
        bookings: bookings,
        recentActivity: bookings.slice(0, 10).map(booking => ({
          id: booking.id,
          type: 'booking',
          message: `New booking for ${booking.className || 'class'}`,
          amount: booking.amount,
          status: booking.status,
          createdAt: booking.createdAt
        }))
      }

      return NextResponse.json(dashboardData)
      
    } catch (firestoreError) {
      console.log('Firestore error, returning empty data:', firestoreError.message)
      
      // Return empty data structure if Firestore fails
      const dashboardData = {
        overview: {
          totalClasses: 0,
          totalInstructors: 0,
          totalCustomers: 0,
          totalRevenue: 0,
          confirmedRevenue: 0,
          totalBookings: 0,
          confirmedBookings: 0
        },
        studio: {
          name: 'Your Studio',
          location: 'Location not set',
          type: 'Fitness Studio',
          amenities: [],
          createdBy: 'user-id'
        },
        classes: [],
        instructors: [],
        customers: [],
        bookings: [],
        recentActivity: []
      }

      return NextResponse.json(dashboardData)
    }

  } catch (error) {
    console.error('Merchant dashboard error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message 
    }, { status: 500 })
  }
} 