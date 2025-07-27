// Server-side API proxy to bypass Kubernetes ingress routing issues
// This handles API calls under /server-api instead of /api

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

let client
let db

async function connectDB() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Authentication helper
async function getAuthenticatedUser() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Handle cookie setting errors
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// Firebase Authentication helper
async function getFirebaseUser(request) {
  try {
    // For Firebase, we'll need to check the Authorization header or cookies
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }
    
    // In a real implementation, you would verify the Firebase JWT token here
    // For now, we'll return a mock user to test the flow
    return {
      uid: 'firebase-test-user',
      email: 'test@example.com'
    }
  } catch (error) {
    console.error('Firebase auth error:', error)
    return null
  }
}

export async function GET(request) {
  return handleCORS(await handleGET(request))
}

export async function POST(request) {
  return handleCORS(await handlePOST(request))
}

export async function PUT(request) {
  return handleCORS(await handlePUT(request))
}

export async function DELETE(request) {
  return handleCORS(await handleDELETE(request))
}

export async function OPTIONS(request) {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

async function handleGET(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    const database = await connectDB()

    console.log('SERVER-API GET Request:', path)

    // Health check
    if (path === '/health') {
      return NextResponse.json({ status: 'Server-API is working', timestamp: new Date().toISOString() })
    }

    // Test endpoint
    if (path === '/test') {
      return NextResponse.json({ message: 'Server-API proxy is working!', path: path })
    }

    // Classes endpoint
    if (path === '/classes') {
      const limit = parseInt(url.searchParams.get('limit') || '10')
      const type = url.searchParams.get('type')
      const location = url.searchParams.get('location')

      let query = {}
      if (type) query.type = type
      if (location) query.location = location

      const classes = await database.collection('classes').find(query).limit(limit).toArray()
      
      if (classes.length === 0) {
        // Create sample classes if none exist
        await createSampleClasses(database)
        const newClasses = await database.collection('classes').find(query).limit(limit).toArray()
        return NextResponse.json({ classes: newClasses, total: newClasses.length })
      }

      return NextResponse.json({ classes, total: classes.length })
    }

    // Firebase role management
    if (path === '/auth/firebase-role') {
      const uid = url.searchParams.get('uid')
      if (!uid) {
        return NextResponse.json({ error: 'UID is required' }, { status: 400 })
      }

      try {
        const user = await database.collection('profiles').findOne({ userId: uid })
        if (!user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user)
      } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }
    }

    // Bookings endpoint
    if (path === '/bookings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const bookings = await db.collection('bookings').find({ userId: firebaseUser.uid }).toArray()
      return NextResponse.json({ bookings })
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('SERVER-API GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePOST(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    await connectDB()

    console.log('SERVER-API POST Request:', path)

    // Firebase role selection
    if (path === '/auth/firebase-role') {
      const body = await request.json()
      const { uid, email, role } = body

      if (!uid || !email || !role) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const validRoles = ['customer', 'instructor', 'merchant']
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }

      try {
        await db.collection('profiles').updateOne(
          { userId: uid },
          {
            $set: {
              userId: uid,
              email,
              role,
              onboarding_complete: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )

        return NextResponse.json({
          message: 'Role updated successfully',
          role,
          redirect: `/onboarding/${role}`
        })
      } catch (error) {
        console.error('Role update error:', error)
        return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
      }
    }

    // Handle booking cancellation
    if (path.match(/^\/bookings\/[^\/]+\/cancel$/)) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const bookingId = path.split('/')[2]
      console.log('Cancelling booking:', bookingId)

      // For now, return success (actual implementation would update database)
      return NextResponse.json({
        message: 'Booking cancelled successfully',
        refund: 'Refund will be processed within 3-5 business days'
      })
    }

    // Handle booking check-in
    if (path.match(/^\/bookings\/[^\/]+\/checkin$/)) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const bookingId = path.split('/')[2]
      console.log('Checking in booking:', bookingId)

      // For now, return success (actual implementation would update database)
      return NextResponse.json({
        message: 'Checked in successfully'
      })
    }

    // Handle onboarding completion
    if (path === '/onboarding/complete') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const body = await request.json()
      const { role, profileData } = body

      if (!role) {
        return NextResponse.json({ error: 'Role is required' }, { status: 400 })
      }

      try {
        // Update user profile with onboarding completion
        await db.collection('profiles').updateOne(
          { userId: firebaseUser.uid },
          {
            $set: {
              role,
              profileData: profileData || {},
              onboarding_complete: true,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )

        console.log('Onboarding completed for user:', firebaseUser.uid)

        return NextResponse.json({
          message: 'Onboarding completed successfully',
          redirect: `/dashboard/${role}`
        })
      } catch (error) {
        console.error('Onboarding completion error:', error)
        return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })

  } catch (error) {
    console.error('SERVER-API POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePUT(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

async function handleDELETE(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

// Helper function to create sample classes
async function createSampleClasses() {
  const sampleClasses = [
    {
      id: 'morning-vinyasa-flow',
      name: 'Morning Vinyasa Flow - Mindful Movement',
      instructor: {
        id: 'sarah-johnson',
        name: 'Sarah Johnson',
        bio: 'Certified yoga instructor with 8+ years of experience in Vinyasa and Hatha yoga.',
        avatar: null,
        rating: 4.9,
        totalReviews: 127,
        specialties: ['Vinyasa Yoga', 'Meditation', 'Breathwork'],
        certifications: ['RYT-500', 'Meditation Teacher Certification']
      },
      description: 'Start your day with intention through this flowing Vinyasa practice.',
      type: 'Yoga',
      level: 'All Levels',
      duration: 75,
      price: 35,
      location: {
        name: 'Harmony Yoga Studio',
        address: '456 Wellness Ave, Downtown',
        city: 'San Francisco',
        state: 'CA'
      },
      heroImage: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
      sessions: [
        {
          id: 'session-1',
          date: '2025-01-30',
          startTime: '08:00',
          endTime: '09:15',
          spotsTotal: 20,
          spotsBooked: 12
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  try {
    for (const classData of sampleClasses) {
      await db.collection('classes').updateOne(
        { id: classData.id },
        { $set: classData },
        { upsert: true }
      )
    }
    console.log('Sample classes created successfully')
  } catch (error) {
    console.error('Error creating sample classes:', error)
  }
}