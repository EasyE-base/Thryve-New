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

      const bookings = await database.collection('bookings').find({ userId: firebaseUser.uid }).toArray()
      return NextResponse.json({ bookings })
    }

    // Instructor profile endpoint
    if (path === '/instructor/profile') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const instructor = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!instructor || instructor.role !== 'instructor') {
          return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 })
        }

        return NextResponse.json({
          _id: instructor._id,
          name: instructor.name || instructor.email.split('@')[0],
          email: instructor.email,
          stripeAccountId: instructor.stripeAccountId,
          stripeAccountStatus: instructor.stripeAccountStatus || 'pending',
          commissionRate: instructor.commissionRate || 0.15
        })
      } catch (error) {
        console.error('Instructor profile fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch instructor profile' }, { status: 500 })
      }
    }

    // Instructor payouts endpoint
    if (path === '/instructor/payouts') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const instructor = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!instructor || instructor.role !== 'instructor') {
          return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 })
        }

        // Get payouts for this instructor (using instructorId as userId for now)
        const payouts = await database.collection('payouts').find({ 
          instructorId: firebaseUser.uid 
        }).sort({ createdAt: -1 }).limit(20).toArray()

        return NextResponse.json(payouts)
      } catch (error) {
        console.error('Instructor payouts fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch instructor payouts' }, { status: 500 })
      }
    }

    // Instructor classes endpoint - GET assigned classes for instructor
    if (path === '/instructor/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const instructor = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!instructor || instructor.role !== 'instructor') {
          return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 })
        }

        // Get classes assigned to this instructor
        const classes = await database.collection('studio_classes').find({ 
          assignedInstructorId: firebaseUser.uid 
        }).sort({ createdAt: -1 }).toArray()

        return NextResponse.json({ classes })
      } catch (error) {
        console.error('Instructor assigned classes fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch assigned classes' }, { status: 500 })
      }
    }

    // Studio classes endpoint - GET all classes for studio
    if (path === '/studio/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const studio = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!studio || studio.role !== 'merchant') {
          return NextResponse.json({ error: 'Studio profile not found' }, { status: 404 })
        }

        // Get classes created by this studio
        const classes = await database.collection('studio_classes').find({ 
          studioId: firebaseUser.uid 
        }).sort({ createdAt: -1 }).toArray()

        return NextResponse.json({ classes })
      } catch (error) {
        console.error('Studio classes fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch studio classes' }, { status: 500 })
      }
    }

    // Available instructors endpoint for studio assignment
    if (path === '/studio/instructors') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const studio = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!studio || studio.role !== 'merchant') {
          return NextResponse.json({ error: 'Studio access required' }, { status: 403 })
        }

        // Get all instructors for assignment
        const instructors = await database.collection('profiles').find({ 
          role: 'instructor' 
        }).project({
          userId: 1,
          name: 1,
          email: 1,
          stripeAccountStatus: 1
        }).toArray()

        return NextResponse.json({ instructors })
      } catch (error) {
        console.error('Available instructors fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch available instructors' }, { status: 500 })
      }
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
    const database = await connectDB()

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
        await database.collection('profiles').updateOne(
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
        await database.collection('profiles').updateOne(
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

    // Handle Stripe Connect account creation
    if (path === '/stripe/connect/account') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Check if instructor profile exists in profiles collection
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!userProfile || userProfile.role !== 'instructor') {
          return NextResponse.json({ error: 'Only instructors can create Stripe Connect accounts' }, { status: 403 })
        }

        // Check if instructor already has a Stripe account
        if (userProfile.stripeAccountId) {
          // Create account link for existing account
          const accountLink = await stripe.accountLinks.create({
            account: userProfile.stripeAccountId,
            refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?refresh=true`,
            return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?success=true`,
            type: 'account_onboarding',
          })
          
          return NextResponse.json({ url: accountLink.url })
        }

        // Create new Stripe Connect Express account
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: firebaseUser.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        })

        // Save Stripe account ID to user profile
        await database.collection('profiles').updateOne(
          { userId: firebaseUser.uid },
          {
            $set: {
              stripeAccountId: account.id,
              stripeAccountStatus: 'onboarding',
              commissionRate: 0.15, // 15% platform commission
              updatedAt: new Date()
            }
          }
        )

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?refresh=true`,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?success=true`,
          type: 'account_onboarding',
        })

        console.log('Stripe Connect account created for instructor:', firebaseUser.uid)

        return NextResponse.json({ url: accountLink.url })
      } catch (error) {
        console.error('Stripe Connect account creation error:', error)
        return NextResponse.json({ error: 'Failed to create Stripe Connect account' }, { status: 500 })
      }
    }

    // Handle class creation (MERCHANT/STUDIO ONLY)
    if (path === '/studio/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { 
          title, description, type, level, duration, price, capacity, 
          location, date, time, recurring, requirements, amenities,
          assignedInstructorId, assignedInstructorName
        } = body

        // Validate required fields
        if (!title || !description || !type || !location || !date || !time) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if user is merchant/studio owner
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!userProfile || userProfile.role !== 'merchant') {
          return NextResponse.json({ error: 'Only studio owners can create classes' }, { status: 403 })
        }

        // Create class data
        const classData = {
          id: `class-${Date.now()}`,
          title,
          description,
          type,
          level: level || 'All Levels',
          duration: parseInt(duration) || 60,
          price: parseFloat(price) || 25,
          capacity: parseInt(capacity) || 15,
          location,
          date,
          time,
          recurring: recurring || false,
          requirements: requirements || '',
          amenities: amenities || [],
          
          // Studio information
          studioId: firebaseUser.uid,
          studioName: userProfile.name || userProfile.email.split('@')[0],
          studioEmail: firebaseUser.email,
          
          // Instructor assignment
          assignedInstructorId: assignedInstructorId || null,
          assignedInstructorName: assignedInstructorName || null,
          instructorAssigned: assignedInstructorId ? true : false,
          
          // Class status
          enrolled: 0,
          enrolledStudents: [],
          status: 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Save class to database
        await database.collection('studio_classes').insertOne(classData)

        console.log('Class created successfully for studio:', firebaseUser.uid)

        return NextResponse.json({
          message: 'Class created successfully',
          classId: classData.id,
          class: classData
        })
      } catch (error) {
        console.error('Class creation error:', error)
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
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
async function createSampleClasses(database) {
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
      await database.collection('classes').updateOne(
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