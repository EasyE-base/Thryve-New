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
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Unauthorized')
  }
  
  return user
}

// Handle all HTTP methods
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
    const path = url.pathname.replace('/api', '')
    await connectDB()

    // Get current user for protected routes
    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      // Some routes don't require auth
    }

    switch (path) {
      case '/classes':
        return await getClasses(url.searchParams)
      
      case (path.match(/^\/classes\/(.+)$/) || {}).input:
        const classId = path.match(/^\/classes\/(.+)$/)[1]
        return await getClassById(classId)
      
      case '/profile':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await getUserProfile(user.id)
      
      case '/bookings':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await getUserBookings(user.id)
      
      case (path.match(/^\/bookings\/(.+)\/cancel$/) || {}).input:
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const bookingId = path.match(/^\/bookings\/(.+)\/cancel$/)[1]
        return await cancelBooking(bookingId, user.id)
      
      case (path.match(/^\/bookings\/(.+)\/checkin$/) || {}).input:
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const checkinBookingId = path.match(/^\/bookings\/(.+)\/checkin$/)[1]
        return await checkInBooking(checkinBookingId, user.id)
      
      case '/booking/by-session':
        return await getBookingBySession(url.searchParams.get('sessionId'))
      
      case '/instructor/classes':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await getInstructorClasses(user.id)
      
      case '/auth/firebase-user':
        return await getFirebaseUser(url.searchParams.get('uid'))
      
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePOST(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api', '')
    
    // Handle webhook requests differently (they need raw body)
    if (path === '/stripe/webhooks') {
      return await handleStripeWebhook(request)
    }
    
    // Handle requests that might not have a body
    let body = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch (e) {
      // No body or invalid JSON, use empty object
    }
    
    await connectDB()

    let user = null
    try {
      user = await getAuthenticatedUser()
    } catch (error) {
      // Some routes don't require auth
    }

    switch (path) {
      case '/classes':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createClass(body, user.id)
      
      case '/bookings':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createBooking(body, user.id)
      
      case (path.match(/^\/bookings\/(.+)\/cancel$/) || {}).input:
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const cancelBookingId = path.match(/^\/bookings\/(.+)\/cancel$/)[1]
        return await cancelBooking(cancelBookingId, user.id)
      
      case (path.match(/^\/bookings\/(.+)\/checkin$/) || {}).input:
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const checkinBookingId = path.match(/^\/bookings\/(.+)\/checkin$/)[1]
        return await checkInBooking(checkinBookingId, user.id)
      
      case '/onboarding/complete':
        // For onboarding completion, handle auth differently since user just went through role selection
        return await completeOnboarding(body, user?.id)
      
      case '/stripe/create-payment-intent':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createPaymentIntent(body, user.id)
      
      case '/stripe/create-checkout-session':
        return await createCheckoutSession(body)
      
      case '/stripe/connect/account':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createConnectAccount(user.id)
      
      case '/auth/test-signup':
        return await testSignup(body)
      
      case '/auth/select-role':
        // For role selection, we'll handle auth differently since user just signed up
        return await handleRoleSelectionAPI(body, user?.id)
      
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePUT(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api', '')
    const body = await request.json()
    await connectDB()

    const user = await getAuthenticatedUser()

    const pathParts = path.split('/')
    
    if (pathParts[1] === 'classes' && pathParts[2]) {
      return await updateClass(pathParts[2], body, user.id)
    }
    
    if (pathParts[1] === 'bookings' && pathParts[2]) {
      return await updateBooking(pathParts[2], body, user.id)
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('PUT Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleDELETE(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/api', '')
    await connectDB()

    const user = await getAuthenticatedUser()

    const pathParts = path.split('/')
    
    if (pathParts[1] === 'classes' && pathParts[2]) {
      return await deleteClass(pathParts[2], user.id)
    }
    
    if (pathParts[1] === 'bookings' && pathParts[2]) {
      return await cancelBooking(pathParts[2], user.id)
    }
    
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// API Functions
async function getClasses(searchParams) {
  const limit = parseInt(searchParams.get('limit')) || 20
  const skip = parseInt(searchParams.get('skip')) || 0
  const type = searchParams.get('type')
  const location = searchParams.get('location')
  
  let filter = { 
    schedule: { $gte: new Date() },
    status: 'active'
  }
  
  if (type) filter.type = type
  if (location) filter.location = new RegExp(location, 'i')
  
  // Add comprehensive sample classes if none exist
  const existingCount = await db.collection('classes').countDocuments({})
  if (existingCount === 0) {
    const sampleClasses = [
      {
        id: 'morning-vinyasa-flow',
        instructorId: 'sarah-johnson',
        title: 'Morning Vinyasa Flow - Mindful Movement',
        slug: 'morning-vinyasa-flow-mindful-movement',
        heroImage: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
        gallery: [
          'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
          'https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
          'https://images.unsplash.com/photo-1651077837628-52b3247550ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHx8MTc1MzYxNjE5N3ww&ixlib=rb-4.1.0&q=85'
        ],
        description: 'Begin your day with intention and movement in this energizing 75-minute vinyasa flow. This thoughtfully sequenced class weaves together breath-synchronized movement, mindful transitions, and moments of stillness to awaken both body and spirit.\n\nPerfect for practitioners seeking to deepen their yoga journey, this class offers modifications for all levels while maintaining the integrity of a strong vinyasa practice.',
        type: 'Yoga',
        category: 'Vinyasa',
        level: 'All Levels',
        intensity: 'Moderate',
        duration: 75,
        price: 35.00,
        originalPrice: 45.00,
        rating: 4.8,
        reviewCount: 89,
        totalBookings: 234,
        location: {
          name: 'Harmony Yoga Studio',
          address: '456 Wellness Ave, Downtown',
          city: 'San Francisco',
          state: 'CA',
          isVirtual: false
        },
        instructor: {
          id: 'sarah-johnson',
          name: 'Sarah Johnson',
          bio: 'Certified yoga instructor with 8+ years of experience in vinyasa, hatha, and restorative yoga.',
          specialties: ['Vinyasa Yoga', 'Mindfulness', 'Breathwork', 'Alignment'],
          rating: 4.9,
          reviewCount: 127,
          totalClasses: 340,
          experience: '8+ years',
          certifications: ['RYT-500', 'Yin Yoga', 'Prenatal Yoga'],
          languages: ['English', 'Spanish']
        },
        schedule: new Date(Date.now() + 24 * 60 * 60 * 1000),
        sessions: [
          {
            id: 'session-1',
            date: new Date(Date.now() + 24 * 60 * 60 * 1000),
            startTime: '08:00',
            endTime: '09:15',
            spotsTotal: 20,
            spotsBooked: 12
          },
          {
            id: 'session-2', 
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            startTime: '08:00',
            endTime: '09:15',
            spotsTotal: 20,
            spotsBooked: 8
          }
        ],
        capacity: 20,
        amenities: [
          'Premium yoga mats provided',
          'Props and blocks available',
          'Filtered water station',
          'Essential oil aromatherapy',
          'Heated studio space'
        ],
        requirements: [
          'Comfortable, stretchy clothing',
          'Water bottle (BPA-free preferred)',
          'Towel for perspiration',
          'Open mind and positive energy'
        ],
        highlights: [
          'Breath-centered movement',
          'Mindful sequencing',
          'All-level modifications',
          'Meditation integration'
        ],
        tags: ['Morning', 'Energizing', 'Mindful', 'Breath Work'],
        cancellationPolicy: 'Free cancellation up to 4 hours before class start time. Late cancellations will result in a 50% credit.',
        status: 'active',
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'hiit-cardio-blast',
        instructorId: 'michael-rodriguez',
        title: 'HIIT Cardio Blast - High Energy Workout',
        slug: 'hiit-cardio-blast-high-energy',
        heroImage: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
        description: 'High-intensity interval training to boost your metabolism and build cardiovascular endurance. Perfect for those looking to maximize their workout in minimal time.',
        type: 'HIIT',
        category: 'Cardio',
        level: 'Intermediate',
        intensity: 'High',
        duration: 45,
        price: 30.00,
        rating: 4.7,
        reviewCount: 156,
        totalBookings: 189,
        location: {
          name: 'FitCore Studio',
          address: '789 Fitness Blvd, Midtown',
          city: 'San Francisco',
          state: 'CA',
          isVirtual: false
        },
        instructor: {
          id: 'michael-rodriguez',
          name: 'Michael Rodriguez',
          bio: 'HIIT specialist with 6+ years of experience in high-intensity training and functional fitness.',
          specialties: ['HIIT', 'Strength Training', 'Functional Movement'],
          rating: 4.7,
          reviewCount: 89,
          experience: '6+ years'
        },
        schedule: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        sessions: [
          {
            id: 'session-hiit-1',
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            startTime: '18:00',
            endTime: '18:45',
            spotsTotal: 15,
            spotsBooked: 10
          }
        ],
        capacity: 15,
        status: 'active',
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'strength-training-basics',
        instructorId: 'david-wilson',
        title: 'Strength Training Basics - Build Foundation',
        slug: 'strength-training-basics-foundation',
        heroImage: 'https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
        description: 'Learn proper form and build strength with guided weight training. Perfect for beginners looking to start their strength journey safely.',
        type: 'Strength',
        category: 'Weight Training',
        level: 'Beginner',
        intensity: 'Moderate',
        duration: 50,
        price: 35.00,
        rating: 4.6,
        reviewCount: 78,
        totalBookings: 134,
        location: {
          name: 'Iron Works Gym',
          address: '321 Power Ave, Westside',
          city: 'San Francisco', 
          state: 'CA',
          isVirtual: false
        },
        instructor: {
          id: 'david-wilson',
          name: 'David Wilson',
          bio: 'Certified strength coach with 8+ years helping beginners build confidence and strength.',
          specialties: ['Strength Training', 'Form Correction', 'Progressive Overload'],
          rating: 4.8,
          reviewCount: 203,
          experience: '8+ years'
        },
        schedule: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        sessions: [
          {
            id: 'session-strength-1',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            startTime: '10:00',
            endTime: '10:50',
            spotsTotal: 12,
            spotsBooked: 7
          }
        ],
        capacity: 12,
        status: 'active',
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    await db.collection('classes').insertMany(sampleClasses)
  }
  
  const classes = await db.collection('classes')
    .find(filter)
    .sort({ schedule: 1 })
    .limit(limit)
    .skip(skip)
    .toArray()
    
  const total = await db.collection('classes').countDocuments(filter)
  
  return NextResponse.json({ classes, total })
}

async function getClassById(classId) {
  try {
    // First try to find by ID
    let classDoc = await db.collection('classes').findOne({ id: classId })
    
    // If not found by id, try by MongoDB _id
    if (!classDoc) {
      try {
        classDoc = await db.collection('classes').findOne({ _id: classId })
      } catch (error) {
        // Invalid ObjectId, continue
      }
    }
    
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Add comprehensive sample data for enhanced class details if needed
    if (!classDoc.reviews) {
      classDoc.reviews = [
        {
          id: 1,
          userId: 'user-1',
          userName: 'Emma Rodriguez',
          rating: 5,
          date: '2 days ago',
          comment: 'Amazing class! The instructor creates such a welcoming atmosphere and the workout is perfectly balanced.',
          helpful: 12,
          verified: true,
          attendance: 15
        },
        {
          id: 2,
          userId: 'user-2',
          userName: 'Michael Chen',
          rating: 5,
          date: '1 week ago',
          comment: 'Great for beginners like myself. Clear instructions and modifications offered throughout.',
          helpful: 8,
          verified: true,
          attendance: 6
        }
      ]
    }

    if (!classDoc.benefits) {
      classDoc.benefits = [
        'Increased flexibility and strength',
        'Improved mental clarity and focus',
        'Stress reduction and relaxation',
        'Better posture and alignment',
        'Enhanced mind-body connection'
      ]
    }

    if (!classDoc.whatToExpect) {
      classDoc.whatToExpected = [
        'Welcome and intention setting (5 min)',
        'Dynamic warm-up sequence (10 min)',
        'Main workout/flow (30+ min)',
        'Cool-down and stretching (10 min)',
        'Final relaxation (5 min)'
      ]
    }

    if (!classDoc.faqs) {
      classDoc.faqs = [
        {
          question: 'What if I\'m a complete beginner?',
          answer: 'This class welcomes all levels! The instructor provides clear modifications and alternatives.'
        },
        {
          question: 'Do I need to bring equipment?',
          answer: 'All necessary equipment is provided, but you\'re welcome to bring your own if you prefer.'
        }
      ]
    }
    
    return NextResponse.json({ class: classDoc })
  } catch (error) {
    console.error('Error fetching class:', error)
    return NextResponse.json({ error: 'Failed to fetch class details' }, { status: 500 })
  }
}

async function createClass(body, userId) {
  const classData = {
    id: uuidv4(),
    instructorId: userId,
    title: body.title,
    description: body.description,
    type: body.type,
    schedule: new Date(body.schedule),
    duration: body.duration,
    capacity: body.capacity,
    price: body.price,
    location: body.location,
    status: 'active',
    bookings: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await db.collection('classes').insertOne(classData)
  
  return NextResponse.json({ 
    message: 'Class created successfully',
    class: classData
  })
}

async function createBooking(body, userId) {
  const { classId, paymentIntentId } = body
  
  // Get class details
  const classDoc = await db.collection('classes').findOne({ id: classId })
  if (!classDoc) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }
  
  // Check capacity
  if (classDoc.bookings && classDoc.bookings.length >= classDoc.capacity) {
    return NextResponse.json({ error: 'Class is full' }, { status: 400 })
  }
  
  // Check if already booked
  const existingBooking = await db.collection('bookings').findOne({
    classId,
    customerId: userId
  })
  
  if (existingBooking) {
    return NextResponse.json({ error: 'Already booked this class' }, { status: 400 })
  }
  
  const booking = {
    id: uuidv4(),
    classId,
    customerId: userId,
    instructorId: classDoc.instructorId,
    paymentIntentId,
    amount: classDoc.price,
    status: 'confirmed',
    createdAt: new Date()
  }
  
  // Create booking
  await db.collection('bookings').insertOne(booking)
  
  // Update class bookings
  await db.collection('classes').updateOne(
    { id: classId },
    { 
      $push: { bookings: userId },
      $set: { updatedAt: new Date() }
    }
  )
  
  return NextResponse.json({ 
    message: 'Booking created successfully',
    booking
  })
}

async function createPaymentIntent(body, userId) {
  const { classId } = body
  
  const classDoc = await db.collection('classes').findOne({ id: classId })
  if (!classDoc) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(classDoc.price * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      classId,
      customerId: userId,
      instructorId: classDoc.instructorId
    }
  })
  
  return NextResponse.json({
    clientSecret: paymentIntent.client_secret
  })
}

async function createCheckoutSession(body) {
  try {
    const { 
      classId, 
      sessionId, 
      className, 
      sessionTime, 
      amount, 
      userId, 
      instructorId 
    } = body

    // Validate required fields
    if (!classId || !sessionId || !className || !amount || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields: classId, sessionId, className, amount, userId' 
      }, { status: 400 })
    }

    // Validate class exists
    const classDoc = await db.collection('classes').findOne({ id: classId })
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 })
    }

    // Create preliminary booking record to track the transaction
    const bookingId = uuidv4()
    const prelimBooking = {
      id: bookingId,
      userId,
      classId,
      sessionId,
      instructorId: instructorId || classDoc.instructor?.id,
      className,
      sessionTime,
      amount,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection('bookings').insertOne(prelimBooking)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: className,
              description: `Fitness Class Session - ${sessionTime}`,
              images: [classDoc.heroImage].filter(Boolean),
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/class/${classId}?booking=cancelled`,
      metadata: {
        bookingId,
        userId,
        classId,
        sessionId,
        instructorId: instructorId || classDoc.instructor?.id || 'unknown'
      },
      billing_address_collection: 'auto',
    })

    // Update booking with Stripe session ID
    await db.collection('bookings').updateOne(
      { id: bookingId },
      { 
        $set: { 
          stripeSessionId: session.id,
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      sessionId: session.id,
      bookingId 
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session: ' + error.message },
      { status: 500 }
    )
  }
}

async function createConnectAccount(userId) {
  const account = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true }
    },
    metadata: { userId }
  })
  
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/instructor?success=true`,
    type: 'account_onboarding'
  })
  
  // Save account ID to user profile
  await db.collection('profiles').updateOne(
    { userId },
    { 
      $set: { 
        stripeAccountId: account.id,
        updatedAt: new Date()
      } 
    },
    { upsert: true }
  )
  
  return NextResponse.json({ url: accountLink.url })
}

async function completeOnboarding(body, userId) {
  console.log('=== ONBOARDING COMPLETION DEBUG ===')
  console.log('Request body:', JSON.stringify(body, null, 2))
  console.log('User ID provided:', userId)
  
  // If no userId provided, try to get it from session
  if (!userId) {
    console.log('No userId provided, attempting to get from session...')
    
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
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ error: 'No active session found. Please log in again.' }, { status: 401 })
    }
    
    userId = session.user.id
    console.log('Got userId from session:', userId)
  }
  
  const { role, profileData } = body
  
  // Check if role is provided
  if (!role) {
    console.error('No role provided in request body')
    return NextResponse.json({ error: 'Role is required for onboarding completion' }, { status: 400 })
  }
  
  // Validate role
  const validRoles = ['customer', 'instructor', 'merchant']
  if (!validRoles.includes(role)) {
    console.error('Invalid role:', role)
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
  }
  
  console.log('Completing onboarding for user:', userId, 'role:', role)
  
  try {
    // Ensure database connection
    await connectDB()
    console.log('Database connected successfully')
    
    // Save profile data to MongoDB (no Supabase metadata!)
    const profile = {
      userId,
      role: role,
      ...profileData,
      onboarding_complete: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    console.log('Saving profile:', JSON.stringify(profile, null, 2))
    
    const result = await db.collection('profiles').updateOne(
      { userId },
      { $set: profile },
      { upsert: true }
    )
    
    console.log('MongoDB update result:', result)
    console.log('Onboarding completed successfully in MongoDB')
    
    return NextResponse.json({ 
      message: 'Onboarding completed successfully',
      profile,
      redirect: `/dashboard/${role}`
    })
  } catch (error) {
    console.error('Onboarding completion error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to save onboarding data',
      details: error.message
    }, { status: 500 })
  }
}

async function getUserProfile(userId) {
  const profile = await db.collection('profiles').findOne({ userId })
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  
  return NextResponse.json({ profile })
}

async function getUserBookings(userId) {
  try {
    // Get user bookings with enhanced class details
    const bookings = await db.collection('bookings')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray()
    
    // Enrich bookings with class and instructor details
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const classDoc = await db.collection('classes').findOne({ id: booking.classId })
        
        return {
          ...booking,
          classDetails: classDoc ? {
            className: classDoc.title,
            heroImage: classDoc.heroImage,
            instructor: classDoc.instructor,
            location: classDoc.location,
            duration: classDoc.duration,
            classType: classDoc.type,
            level: classDoc.level
          } : null
        }
      })
    )
    
    return NextResponse.json({ bookings: enrichedBookings })
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}

async function cancelBooking(bookingId, userId) {
  try {
    // Find the booking
    const booking = await db.collection('bookings').findOne({ 
      id: bookingId, 
      userId 
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if cancellation is allowed (e.g., not within 4 hours of class)
    const classDateTime = new Date(`${booking.sessionTime}`)
    const now = new Date()
    const hoursUntilClass = (classDateTime - now) / (1000 * 60 * 60)

    if (hoursUntilClass < 4) {
      return NextResponse.json({ 
        error: 'Cannot cancel within 4 hours of class start time' 
      }, { status: 400 })
    }

    // Update booking status
    await db.collection('bookings').updateOne(
      { id: bookingId, userId },
      { 
        $set: { 
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    // Update class availability (increase available spots)
    await db.collection('classes').updateOne(
      { id: booking.classId },
      { 
        $inc: { 
          'sessions.$[session].spotsBooked': -1 
        },
        $set: { updatedAt: new Date() }
      },
      { 
        arrayFilters: [{ 'session.id': booking.sessionId }] 
      }
    )

    // In production, you might want to process refunds here
    // For now, we'll just mark it as cancelled

    return NextResponse.json({ 
      message: 'Booking cancelled successfully',
      refund: 'Refund will be processed within 3-5 business days'
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}

async function checkInBooking(bookingId, userId) {
  try {
    // Find the booking
    const booking = await db.collection('bookings').findOne({ 
      id: bookingId, 
      userId 
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Check if check-in is allowed (e.g., within 30 minutes of class start)
    const classDateTime = new Date(booking.sessionTime)
    const now = new Date()
    const minutesUntilClass = (classDateTime - now) / (1000 * 60)

    if (minutesUntilClass > 30) {
      return NextResponse.json({ 
        error: 'Check-in opens 30 minutes before class starts' 
      }, { status: 400 })
    }

    if (minutesUntilClass < -60) {
      return NextResponse.json({ 
        error: 'Check-in is no longer available for this class' 
      }, { status: 400 })
    }

    // Update booking with check-in
    await db.collection('bookings').updateOne(
      { id: bookingId, userId },
      { 
        $set: { 
          checkedIn: true,
          checkedInAt: new Date(),
          updatedAt: new Date()
        } 
      }
    )

    return NextResponse.json({ 
      message: 'Checked in successfully!',
      checkedInAt: new Date()
    })
  } catch (error) {
    console.error('Error checking in:', error)
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 })
  }
}

async function getBookingBySession(sessionId) {
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  try {
    // Find booking by Stripe session ID
    const booking = await db.collection('bookings').findOne({ 
      stripeSessionId: sessionId 
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Get additional class details if needed
    const classDoc = await db.collection('classes').findOne({ id: booking.classId })
    
    // Enrich booking data with class information
    const enrichedBooking = {
      ...booking,
      classDetails: classDoc ? {
        heroImage: classDoc.heroImage,
        instructor: classDoc.instructor,
        location: classDoc.location,
        duration: classDoc.duration
      } : null
    }

    return NextResponse.json({ booking: enrichedBooking })
  } catch (error) {
    console.error('Error fetching booking by session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    )
  }
}

async function getInstructorClasses(userId) {
  const classes = await db.collection('classes')
    .find({ instructorId: userId })
    .sort({ schedule: 1 })
    .toArray()
  
  return NextResponse.json({ classes })
}

async function handleStripeWebhook(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  
  let event
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object
      await handlePaymentSuccess(paymentIntent)
      break
    
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object)
      break
    
    case 'account.updated':
      const account = event.data.object
      await handleAccountUpdate(account)
      break
    
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
  
  return NextResponse.json({ received: true })
}

async function handlePaymentSuccess(paymentIntent) {
  const { classId, customerId, instructorId } = paymentIntent.metadata
  
  // Update booking status
  await db.collection('bookings').updateOne(
    { paymentIntentId: paymentIntent.id },
    { 
      $set: { 
        status: 'paid',
        paidAt: new Date()
      }
    }
  )
  
  // Create instructor payout (85% of payment, 15% platform fee)
  const instructorAmount = Math.round(paymentIntent.amount * 0.85)
  
  // Get instructor's Stripe account
  const profile = await db.collection('profiles').findOne({ userId: instructorId })
  
  if (profile?.stripeAccountId) {
    try {
      await stripe.transfers.create({
        amount: instructorAmount,
        currency: 'usd',
        destination: profile.stripeAccountId,
        metadata: {
          classId,
          customerId,
          instructorId
        }
      })
    } catch (error) {
      console.error('Failed to create transfer:', error)
    }
  }
}

async function handleAccountUpdate(account) {
  await db.collection('profiles').updateOne(
    { stripeAccountId: account.id },
    { 
      $set: { 
        stripeAccountStatus: account.requirements?.disabled_reason ? 'restricted' : 'active',
        updatedAt: new Date()
      }
    }
  )
}

async function handleCheckoutSessionCompleted(session) {
  try {
    console.log('Processing checkout session completed:', session.id)
    
    const { bookingId, userId, classId, sessionId, instructorId } = session.metadata
    
    if (!bookingId) {
      console.error('No booking ID found in session metadata')
      return
    }
    
    // Update booking status to confirmed and paid
    const updateResult = await db.collection('bookings').updateOne(
      { id: bookingId },
      { 
        $set: { 
          status: 'confirmed',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          paidAt: new Date(),
          updatedAt: new Date()
        }
      }
    )
    
    if (updateResult.matchedCount === 0) {
      console.error('Booking not found for ID:', bookingId)
      return
    }
    
    console.log('Booking updated successfully:', bookingId)
    
    // Update class booking count if needed
    if (classId && sessionId) {
      await db.collection('classes').updateOne(
        { id: classId, 'sessions.id': sessionId },
        { 
          $inc: { 'sessions.$.spotsBooked': 1 },
          $set: { updatedAt: new Date() }
        }
      )
    }
    
    // Create instructor payout (85% of payment, 15% platform fee)
    if (instructorId && session.amount_total) {
      const instructorAmount = Math.round(session.amount_total * 0.85)
      
      // Get instructor's Stripe account
      const profile = await db.collection('profiles').findOne({ userId: instructorId })
      
      if (profile?.stripeAccountId) {
        try {
          await stripe.transfers.create({
            amount: instructorAmount,
            currency: 'usd',
            destination: profile.stripeAccountId,
            metadata: {
              bookingId,
              classId,
              sessionId,
              userId,
              instructorId
            }
          })
          console.log('Transfer created for instructor:', instructorId)
        } catch (error) {
          console.error('Failed to create transfer:', error)
        }
      }
    }
    
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

// Debug functions
async function testSignup(body) {
  const { email, password } = body
  
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
  
  try {
    // Test signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          onboarding_complete: false
        }
      }
    })
    
    console.log('Signup result:', data)
    console.log('Signup error:', error)
    
    // Check session immediately after
    const { data: sessionData } = await supabase.auth.getSession()
    
    return NextResponse.json({
      signup: { data, error },
      session: sessionData,
      message: 'Debug signup complete'
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function debugSession() {
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
  
  const { data: sessionData } = await supabase.auth.getSession()
  const { data: userData } = await supabase.auth.getUser()
  
  return NextResponse.json({
    session: sessionData,
    user: userData,
    cookies: cookieStore.getAll(),
    message: 'Debug session info'
  })
}

async function getFirebaseUser(uid) {
  if (!uid) {
    return NextResponse.json({ error: 'UID parameter is required' }, { status: 400 })
  }

  try {
    await connectDB()
    
    // Look up user profile in MongoDB by Firebase UID
    const profile = await db.collection('profiles').findOne({ userId: uid })
    
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      uid: profile.userId,
      email: profile.email,
      role: profile.role,
      onboarding_complete: profile.onboarding_complete,
      profile: profile
    })
  } catch (error) {
    console.error('Error fetching Firebase user:', error)
    return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}

async function handleRoleSelectionAPI(body, userId) {
  const { role } = body
  
  console.log('=== ROLE SELECTION API ===')
  console.log('User ID:', userId)
  console.log('Selected role:', role)
  
  // If no userId passed, try to get it from the session directly
  if (!userId) {
    console.log('No userId provided, attempting to get from session...')
    
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
    if (!session?.user) {
      console.log('No session found')
      return NextResponse.json({ error: 'No active session found. Please log in again.' }, { status: 401 })
    }
    
    userId = session.user.id
    console.log('Got userId from session:', userId)
  }
  
  // Validate role
  const validRoles = ['customer', 'instructor', 'merchant']
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 })
  }
  
  try {
    // Store role selection in MongoDB
    await db.collection('profiles').updateOne(
      { userId },
      { 
        $set: { 
          role,
          onboarding_complete: false,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    )
    
    console.log('Role stored in MongoDB successfully for user:', userId)
    
    return NextResponse.json({ 
      message: 'Role selected successfully',
      role,
      redirect: `/onboarding/${role}`
    })
  } catch (error) {
    console.error('MongoDB role storage error:', error)
    return NextResponse.json({ 
      error: 'Failed to store role selection'
    }, { status: 500 })
  }
}