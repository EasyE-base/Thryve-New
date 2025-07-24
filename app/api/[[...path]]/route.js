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
      
      case '/instructor/classes':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await getInstructorClasses(user.id)
      
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
      
      case '/onboarding/complete':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await completeOnboarding(body, user.id)
      
      case '/stripe/create-payment-intent':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createPaymentIntent(body, user.id)
      
      case '/stripe/connect/account':
        if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return await createConnectAccount(user.id)
      
      case '/stripe/webhooks':
        return await handleStripeWebhook(request)
      
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
  
  // Add some sample classes if none exist
  const existingCount = await db.collection('classes').countDocuments({})
  if (existingCount === 0) {
    const sampleClasses = [
      {
        id: uuidv4(),
        instructorId: 'sample-instructor-1',
        title: 'Morning Yoga Flow',
        description: 'Start your day with energizing yoga poses and breathing exercises.',
        type: 'Yoga',
        schedule: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        duration: 60,
        capacity: 15,
        price: 25.00,
        location: 'Studio A, Downtown',
        status: 'active',
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        instructorId: 'sample-instructor-2',
        title: 'HIIT Cardio Blast',
        description: 'High-intensity interval training to boost your metabolism.',
        type: 'HIIT',
        schedule: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        duration: 45,
        capacity: 12,
        price: 30.00,
        location: 'Studio B, Midtown',
        status: 'active',
        bookings: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        instructorId: 'sample-instructor-3',
        title: 'Strength Training Basics',
        description: 'Learn proper form and build strength with guided weight training.',
        type: 'Strength',
        schedule: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
        duration: 50,
        capacity: 10,
        price: 35.00,
        location: 'Gym Floor, Westside',
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
  const { role, profileData } = body
  
  // Update Supabase user metadata
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
  
  await supabase.auth.updateUser({
    data: { onboarding_complete: true }
  })
  
  // Save profile data to MongoDB
  const profile = {
    userId,
    role,
    ...profileData,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  await db.collection('profiles').updateOne(
    { userId },
    { $set: profile },
    { upsert: true }
  )
  
  return NextResponse.json({ 
    message: 'Onboarding completed successfully',
    profile
  })
}

async function getUserProfile(userId) {
  const profile = await db.collection('profiles').findOne({ userId })
  
  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }
  
  return NextResponse.json({ profile })
}

async function getUserBookings(userId) {
  const bookings = await db.collection('bookings')
    .find({ customerId: userId })
    .sort({ createdAt: -1 })
    .toArray()
  
  // Get class details for each booking
  const bookingsWithClasses = await Promise.all(
    bookings.map(async (booking) => {
      const classDoc = await db.collection('classes').findOne({ id: booking.classId })
      return { ...booking, class: classDoc }
    })
  )
  
  return NextResponse.json({ bookings: bookingsWithClasses })
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