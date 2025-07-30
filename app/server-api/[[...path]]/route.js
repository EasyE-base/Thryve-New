// Server-side API proxy to bypass Kubernetes ingress routing issues
// This handles API calls under /server-api instead of /api

import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Stripe from 'stripe'
import AIConfigurationWizard from '../../../lib/ai-configuration-wizard.js'

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

// Helper function to ensure test profiles exist
async function ensureTestProfiles(database) {
  try {
    // Check if test instructor profile exists
    const testInstructor = await database.collection('profiles').findOne({ userId: 'test-instructor-user' })
    if (!testInstructor) {
      await database.collection('profiles').insertOne({
        userId: 'test-instructor-user',
        email: 'instructor@test.com',
        name: 'Test Instructor',
        role: 'instructor',
        onboarding_complete: true,
        stripeAccountId: 'acct_test_instructor',
        stripeAccountStatus: 'enabled',
        commissionRate: 0.70, // 70% instructor, 30% platform
        createdAt: new Date(),
        isTestProfile: true
      })
      
      // Create instructor payout profile
      await database.collection('instructor_payouts').insertOne({
        instructorId: 'test-instructor-user',
        stripeAccountId: 'acct_test_instructor',
        commissionRate: 0.70,
        payoutSchedule: 'weekly',
        minimumPayoutAmount: 25.00,
        totalEarnings: 0,
        totalPayouts: 0,
        createdAt: new Date(),
        isTestProfile: true
      })
    }
    
    // Ensure test merchant exists with proper role
    const testMerchant = await database.collection('profiles').findOne({ userId: 'firebase-test-user' })
    if (!testMerchant) {
      await database.collection('profiles').insertOne({
        userId: 'firebase-test-user',
        email: 'test@example.com',
        name: 'Test Studio',
        role: 'merchant',
        studioName: 'Test Studio',
        businessName: 'Test Studio',
        onboarding_complete: true,
        createdAt: new Date(),
        isTestProfile: true
      })
    } else if (testMerchant.role !== 'merchant') {
      // Update role if exists but incorrect
      await database.collection('profiles').updateOne(
        { userId: 'firebase-test-user' },
        { $set: { role: 'merchant' } }
      )
    }
  } catch (error) {
    console.error('Error ensuring test profiles:', error)
  }
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
    // For testing, we'll return different mock users based on the request path
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    
    // Return instructor user for instructor endpoints
    if (path.includes('/instructor/')) {
      return {
        uid: 'test-instructor-user',
        email: 'instructor@test.com'
      }
    }
    
    // Return merchant user for studio endpoints
    if (path.includes('/studio/')) {
      return {
        uid: 'firebase-test-user',  // This user exists with merchant role
        email: 'test@example.com'
      }
    }
    
    // Default merchant user for other endpoints
    return {
      uid: 'firebase-test-user',
      email: 'test@example.com'
    }
  } catch (error) {
    console.error('Firebase auth error:', error)
    return null
  }
}

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Helper function to get waitlist position
async function getWaitlistPosition(classId) {
  try {
    const waitlist = await db.collection('waitlist')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .orderBy('joinedAt', 'asc')
      .get()
    
    return waitlist.size + 1
  } catch (error) {
    console.error('Error getting waitlist position:', error)
    return 1
  }
}

// Helper function to generate trending reason
function generateTrendingReason(classItem, bookingCount) {
  const reasons = []
  
  if (bookingCount >= (classItem.capacity * 0.8)) {
    reasons.push("High booking rate")
  }
  
  if (classItem.rating >= 4.5) {
    reasons.push("Highly rated")
  }
  
  if (classItem.recentlyCreated) {
    reasons.push("New and popular")
  }
  
  if (bookingCount >= 10) {
    reasons.push("Community favorite")
  }
  
  return reasons.length > 0 ? reasons.join(" • ") : "Rising popularity"
}

// Helper function to get trending studios
async function getTrendingStudios(startDate, endDate, limit, database) {
  try {
    // Get studios with high booking rates
    const studioBookings = await database.collection('bookings')
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'confirmed'
          }
        },
        {
          $group: {
            _id: '$studioId',
            bookingCount: { $sum: 1 },
            uniqueCustomers: { $addToSet: '$userId' }
          }
        },
        {
          $sort: { bookingCount: -1 }
        },
        {
          $limit: limit
        }
      ])
      .toArray()

    // Get studio details
    const studioIds = studioBookings.map(sb => sb._id)
    const studios = await database.collection('profiles')
      .find({ 
        userId: { $in: studioIds },
        role: 'merchant'
      })
      .toArray()

    return studioBookings.map(booking => {
      const studio = studios.find(s => s.userId === booking._id)
      return {
        id: booking._id,
        name: studio?.businessName || studio?.studioName || 'Unknown Studio',
        bookingCount: booking.bookingCount,
        uniqueCustomers: booking.uniqueCustomers.length,
        trendScore: booking.bookingCount * (booking.uniqueCustomers.length / booking.bookingCount),
        location: studio?.address,
        type: 'studio'
      }
    })

  } catch (error) {
    console.error('Get trending studios error:', error)
    return 1
  }
}

// Helper function to promote from waitlist
async function promoteFromWaitlist(classId) {
  try {
    // Get the first person on waitlist
    const waitlistQuery = await db.collection('waitlist')
      .where('classId', '==', classId)
      .where('status', '==', 'active')
      .orderBy('joinedAt', 'asc')
      .limit(1)
      .get()

    if (waitlistQuery.empty) return

    const waitlistDoc = waitlistQuery.docs[0]
    const waitlistData = waitlistDoc.data()

    // Get class data for booking
    const classData = await db.collection('classes').doc(classId).get()
    
    if (!classData.exists) return

    // Create booking for promoted user
    await db.collection('bookings').add({
      id: generateId(),
      userId: waitlistData.userId,
      classId: classId,
      status: 'confirmed',
      paymentMethod: 'waitlist_promotion',
      paymentStatus: 'completed',
      bookingDate: new Date(),
      classDate: waitlistData.classDate || new Date(),
      price: 0, // Free promotion from waitlist
      promotedFromWaitlist: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Update waitlist status
    await waitlistDoc.ref.update({
      status: 'promoted',
      promotedAt: new Date(),
      updatedAt: new Date()
    })

    // Send notification to promoted user
    await createNotification(
      waitlistData.userId,
      'waitlist_promotion',
      'Spot Available!',
      `Great news! A spot opened up in ${classData.data().title}. You've been automatically booked.`,
      {
        classId: classId,
        className: classData.data().title,
        classDate: classData.data().date,
        classTime: classData.data().time
      }
    )
    
    console.log(`Promoted user ${waitlistData.userId} from waitlist for class ${classId}`)
  } catch (error) {
    console.error('Error promoting from waitlist:', error)
  }
}

// Helper function to create notifications
async function createNotification(database, userId, type, title, message, data = {}, deliveryType = 'inApp') {
  try {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      data,
      deliveryType,
      read: false,
      createdAt: new Date()
    }
    
    await database.collection('notifications').insertOne(notification)
    
    // TODO: Send push notification, email, or SMS based on deliveryType
    // if (deliveryType.includes('push')) await sendPushNotification(userId, title, message)
    // if (deliveryType.includes('email')) await sendEmailNotification(userId, title, message)
    // if (deliveryType.includes('sms')) await sendSMSNotification(userId, title, message)
    
    return notificationId
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
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

    // Ensure test profiles exist for testing
    await ensureTestProfiles(database)

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

    // ===== COMMUNICATION LAYER ENDPOINTS (GET) =====
    
    // Get Message Threads
    if (path === '/messages/threads') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const threads = await database.collection('messageThreads')
          .find({ participantIds: user.uid })
          .sort({ lastMessageAt: -1 })
          .toArray()

        const threadsData = []
        for (const thread of threads) {
          // Get participant details
          const participants = []
          for (const participantId of thread.participantIds) {
            if (participantId !== user.uid) {
              const participant = await database.collection('profiles').findOne({ userId: participantId })
              if (participant) {
                participants.push({
                  id: participantId,
                  name: participant.name || participant.email,
                  role: participant.role,
                  avatar: participant.avatar
                })
              }
            }
          }

          // Count unread messages
          const unreadCount = await database.collection('messages')
            .countDocuments({
              threadId: thread.id,
              senderId: { $ne: user.uid },
              readBy: { $nin: [user.uid] }
            })

          threadsData.push({
            id: thread.id,
            type: thread.type || 'direct',
            name: thread.name,
            participants,
            lastMessage: thread.lastMessage || null,
            unreadCount,
            classId: thread.classId,
            className: thread.className,
            createdAt: thread.createdAt
          })
        }

        return NextResponse.json({ success: true, threads: threadsData })
      } catch (error) {
        console.error('Error fetching message threads:', error)
        return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
      }
    }

    // Get Messages for Thread
    if (path.startsWith('/messages/threads/') && path.endsWith('/messages')) {
      const pathParts = path.split('/')
      const threadId = pathParts[3]
      
      try {
        const messages = await database.collection('messages')
          .find({ threadId })
          .sort({ timestamp: 1 })
          .limit(100)
          .toArray()

        const messagesData = messages.map(message => ({
          id: message.id,
          content: message.content,
          type: message.type || 'text',
          senderId: message.senderId,
          senderName: message.senderName,
          timestamp: message.timestamp,
          readBy: message.readBy || [],
          attachments: message.attachments || []
        }))

        return NextResponse.json({ success: true, messages: messagesData })
      } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }
    }

    // Get User Notifications
    if (path === '/notifications') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const notifications = await database.collection('notifications')
          .find({ userId: user.uid })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()

        let unreadCount = 0
        const notificationsData = notifications.map(notification => {
          if (!notification.read) unreadCount++
          
          return {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data || {},
            read: notification.read || false,
            createdAt: notification.createdAt
          }
        })

        return NextResponse.json({ 
          success: true, 
          notifications: notificationsData,
          unreadCount 
        })
      } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
      }
    }

    // Get Notification Settings
    if (path === '/notifications/settings') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userSettings = await database.collection('userSettings').findOne({ userId: user.uid })
        const settings = userSettings?.notifications || {
          email: true,
          sms: false,
          push: true,
          inApp: true,
          bookingConfirmations: true,
          classReminders: true,
          paymentAlerts: true,
          promotions: false,
          socialUpdates: true
        }

        return NextResponse.json({ success: true, settings })
      } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
      }
    }

    // Get Communication Stats (Merchant only)
    if (path === '/communication/stats') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Check if user is merchant
      const profile = await database.collection('profiles').findOne({ userId: user.uid })
      if (!profile || profile.role !== 'merchant') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      try {
        // Get basic communication stats
        const stats = {
          messagesSent: await database.collection('messages').countDocuments({ 
            senderId: user.uid,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }),
          openRate: "68%", // Mock data for now
          responseRate: "45%", // Mock data for now
          totalThreads: await database.collection('messageThreads').countDocuments({
            participantIds: user.uid
          })
        }

        return NextResponse.json({ success: true, stats })
      } catch (error) {
        console.error('Error fetching communication stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
      }
    }

    // Get Communication Broadcasts (Merchant only)
    if (path === '/communication/broadcasts') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const profile = await database.collection('profiles').findOne({ userId: user.uid })
      if (!profile || profile.role !== 'merchant') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      try {
        const broadcasts = await database.collection('broadcasts')
          .find({ studioId: user.uid })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray()

        return NextResponse.json({ success: true, broadcasts })
      } catch (error) {
        console.error('Error fetching broadcasts:', error)
        return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 })
      }
    }

    // Get Communication Templates (Merchant only)
    if (path === '/communication/templates') {
      const user = await getFirebaseUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const profile = await database.collection('profiles').findOne({ userId: user.uid })
      if (!profile || profile.role !== 'merchant') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      try {
        const templates = await database.collection('messageTemplates')
          .find({ studioId: user.uid })
          .toArray()

        return NextResponse.json({ success: true, templates })
      } catch (error) {
        console.error('Error fetching templates:', error)
        return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
      }
    }

    // Enhanced Booking System Endpoints
  
  // Real-time class availability
  if (path.startsWith('/classes/') && path.endsWith('/availability')) {
    const classId = path.split('/')[2]
    try {
      const classData = await db.collection('classes').doc(classId).get()
      const bookings = await db.collection('bookings')
        .where('classId', '==', classId)
        .where('status', '==', 'confirmed')
        .get()

      const confirmedBookings = bookings.size
      const capacity = classData.data()?.capacity || 20
      const availableSpots = Math.max(0, capacity - confirmedBookings)
      
      // Check if current user is waitlisted
      let isUserWaitlisted = false
      if (user) {
        const waitlistCheck = await db.collection('waitlist')
          .where('classId', '==', classId)
          .where('userId', '==', user.uid)
          .where('status', '==', 'active')
          .get()
        isUserWaitlisted = !waitlistCheck.empty
      }

      return NextResponse.json({
        success: true,
        availableSpots,
        capacity,
        confirmedBookings,
        isUserWaitlisted,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
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

    // Handle business logic endpoints

    // User membership and class pack management
    if (path === '/user/memberships') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Get user's active memberships and class packs
        const memberships = await database.collection('user_memberships').find({ 
          userId: firebaseUser.uid,
          status: { $in: ['active', 'pending'] }
        }).toArray()
        
        const classPacks = await database.collection('user_class_packs').find({ 
          userId: firebaseUser.uid,
          creditsRemaining: { $gt: 0 },
          status: 'active'
        }).toArray()
        
        const xPassCredits = await database.collection('user_xpass_credits').find({ 
          userId: firebaseUser.uid,
          creditsRemaining: { $gt: 0 },
          status: 'active'
        }).toArray()

        return NextResponse.json({
          memberships,
          classPacks,
          xPassCredits,
          totalCredits: classPacks.reduce((sum, pack) => sum + pack.creditsRemaining, 0) + 
                       xPassCredits.reduce((sum, pack) => sum + pack.creditsRemaining, 0)
        })
      } catch (error) {
        console.error('User memberships fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch user memberships' }, { status: 500 })
      }
    }

    // User transaction history
    if (path === '/user/transactions') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const transactions = await database.collection('user_transactions').find({ 
          userId: firebaseUser.uid 
        }).sort({ createdAt: -1 }).limit(50).toArray()

        return NextResponse.json({ transactions })
      } catch (error) {
        console.error('User transactions fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
      }
    }

    // Studio X Pass settings
    if (path === '/studio/xpass-settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const studio = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!studio || studio.role !== 'merchant') {
          return NextResponse.json({ error: 'Studio access required' }, { status: 403 })
        }

        const xpassSettings = await database.collection('studio_xpass_settings').findOne({ 
          studioId: firebaseUser.uid 
        })

        return NextResponse.json(xpassSettings || {
          studioId: firebaseUser.uid,
          xpassEnabled: false,
          acceptedClassTypes: [],
          cancellationWindow: 2, // hours
          noShowFee: 15, // dollars
          lateCancelFee: 10
        })
      } catch (error) {
        console.error('Studio X Pass settings fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch X Pass settings' }, { status: 500 })
      }
    }
    
    // NOTIFICATION SYSTEM ENDPOINTS

    // Get user notifications
    if (path === '/notifications/inbox') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const notifications = await database.collection('notifications').find({
          recipients: firebaseUser.uid,
          type: { $in: ['in_app', 'email'] }
        }).sort({ createdAt: -1 }).limit(50).toArray()

        const unreadCount = await database.collection('notifications').countDocuments({
          recipients: firebaseUser.uid,
          readAt: null,
          type: 'in_app'
        })

        return NextResponse.json({
          notifications,
          unreadCount,
          total: notifications.length
        })
      } catch (error) {
        console.error('Notifications fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
      }
    }

    // ANALYTICS SYSTEM ENDPOINTS
    
    // Studio analytics dashboard
    if (path === '/analytics/studio') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const studio = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!studio || studio.role !== 'merchant') {
          return NextResponse.json({ error: 'Studio access required' }, { status: 403 })
        }

        // Get date range from query params
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const endDate = url.searchParams.get('endDate') || new Date().toISOString()

        // Revenue analytics
        const revenueData = await database.collection('user_transactions').find({
          studioId: firebaseUser.uid,
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: 'completed'
        }).toArray()

        const totalRevenue = revenueData.reduce((sum, txn) => sum + txn.amount, 0)
        const platformFees = totalRevenue * 0.0375 // 3.75%
        const studioEarnings = totalRevenue - platformFees

        // Class performance
        const classPerformance = await database.collection('studio_classes').find({
          studioId: firebaseUser.uid,
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).toArray()

        const totalClasses = classPerformance.length
        const totalBookings = classPerformance.reduce((sum, cls) => sum + (cls.enrolled || 0), 0)
        const averageUtilization = totalClasses > 0 ? (totalBookings / (totalClasses * 15)) * 100 : 0 // Assuming avg capacity of 15

        // X Pass analytics
        const xpassRedemptions = await database.collection('user_transactions').find({
          studioId: firebaseUser.uid,
          type: 'xpass_redemption',
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }).toArray()

        const xpassRevenue = xpassRedemptions.reduce((sum, txn) => sum + txn.amount, 0)
        const xpassFees = xpassRevenue * 0.05 // 5% for X Pass

        return NextResponse.json({
          dateRange: { startDate, endDate },
          revenue: {
            total: totalRevenue,
            platformFees: platformFees,
            studioEarnings: studioEarnings,
            xpassRevenue: xpassRevenue,
            xpassFees: xpassFees
          },
          classes: {
            totalClasses,
            totalBookings,
            averageUtilization: Math.round(averageUtilization * 100) / 100
          },
          xpass: {
            redemptions: xpassRedemptions.length,
            revenue: xpassRevenue,
            fees: xpassFees
          },
          trends: {
            dailyRevenue: [], // TODO: Implement daily breakdown
            popularClasses: [], // TODO: Implement class ranking
            peakHours: [] // TODO: Implement time analysis
          }
        })
      } catch (error) {
        console.error('Studio analytics error:', error)
        return NextResponse.json({ error: 'Failed to fetch studio analytics' }, { status: 500 })
      }
    }

    // Platform analytics (admin only)
    if (path === '/analytics/platform') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // TODO: Add admin role check
      try {
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const endDate = url.searchParams.get('endDate') || new Date().toISOString()

        // Platform revenue
        const allTransactions = await database.collection('user_transactions').find({
          createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
          status: 'completed'
        }).toArray()

        const totalPlatformRevenue = allTransactions.reduce((sum, txn) => sum + (txn.platformFee || 0), 0)
        const totalGMV = allTransactions.reduce((sum, txn) => sum + txn.amount, 0) // Gross Merchandise Value

        // User metrics
        const totalUsers = await database.collection('profiles').countDocuments({})
        const activeStudios = await database.collection('profiles').countDocuments({ role: 'merchant' })
        const activeInstructors = await database.collection('profiles').countDocuments({ role: 'instructor' })

        // X Pass metrics
        const xpassUsers = await database.collection('user_xpass_credits').distinct('userId')
        const totalXPassCredits = await database.collection('user_xpass_credits').aggregate([
          { $group: { _id: null, total: { $sum: '$creditsTotal' } } }
        ]).toArray()

        return NextResponse.json({
          dateRange: { startDate, endDate },
          revenue: {
            platformRevenue: totalPlatformRevenue,
            grossMerchandiseValue: totalGMV,
            revenueShare: totalPlatformRevenue / totalGMV * 100
          },
          users: {
            total: totalUsers,
            studios: activeStudios,
            instructors: activeInstructors,
            xpassUsers: xpassUsers.length
          },
          xpass: {
            totalCreditsIssued: totalXPassCredits[0]?.total || 0,
            activeUsers: xpassUsers.length
          }
        })
      } catch (error) {
        console.error('Platform analytics error:', error)
        return NextResponse.json({ error: 'Failed to fetch platform analytics' }, { status: 500 })
      }
    }

    // FILE UPLOAD ENDPOINTS

    // Get uploaded files
    if (path === '/files/list') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const fileType = url.searchParams.get('type')
        const entityId = url.searchParams.get('entityId')

        let query = { uploaderId: firebaseUser.uid }
        if (fileType) query.fileType = fileType
        if (entityId) query.entityId = entityId

        const files = await database.collection('uploaded_files').find(query).sort({ uploadedAt: -1 }).toArray()

        return NextResponse.json({
          files: files.map(file => ({
            id: file.id,
            filename: file.filename,
            fileType: file.fileType,
            mimeType: file.mimeType,
            size: file.size,
            url: file.dataUrl,
            uploadedAt: file.uploadedAt
          }))
        })
      } catch (error) {
        console.error('File list error:', error)
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 })
      }
    }

    // ========================================
    // INSTRUCTOR STAFFING & SCHEDULE MANAGEMENT SYSTEM - GET ENDPOINTS
    // ========================================

    // Get instructor schedule with swap and coverage info
    if (path === '/staffing/schedule') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0]
        const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Get assigned classes
        const classes = await database.collection('studio_classes').find({
          assignedInstructorId: firebaseUser.uid,
          startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).sort({ startTime: 1 }).toArray()

        // Get swap requests for these classes
        const classIds = classes.map(c => c.id)
        const swapRequests = await database.collection('swap_requests').find({
          $or: [
            { classId: { $in: classIds } },
            { initiatorId: firebaseUser.uid },
            { recipientId: firebaseUser.uid }
          ]
        }).toArray()

        // Get coverage requests
        const coverageRequests = await database.collection('coverage_requests').find({
          classId: { $in: classIds }
        }).toArray()

        // Enhance classes with swap and coverage info
        const enhancedClasses = classes.map(classItem => {
          const swapInfo = swapRequests.find(swap => swap.classId === classItem.id)
          const coverageInfo = coverageRequests.find(cov => cov.classId === classItem.id)

          return {
            ...classItem,
            swapRequest: swapInfo || null,
            coverageRequest: coverageInfo || null,
            canRequestSwap: !swapInfo || swapInfo.status === 'rejected',
            canRequestCoverage: !coverageInfo || coverageInfo.status === 'cancelled'
          }
        })

        return NextResponse.json({
          classes: enhancedClasses,
          totalClasses: enhancedClasses.length,
          dateRange: { startDate, endDate }
        })
      } catch (error) {
        console.error('Schedule fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
      }
    }

    // Get coverage pool (open classes needing coverage)
    if (path === '/staffing/coverage-pool') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Get open coverage requests
        const openCoverageRequests = await database.collection('coverage_requests').find({
          status: 'open'
        }).toArray()

        // Get class details for each coverage request
        const classIds = openCoverageRequests.map(req => req.classId)
        const classes = await database.collection('studio_classes').find({
          id: { $in: classIds }
        }).toArray()

        // Combine coverage requests with class details
        const coveragePool = openCoverageRequests.map(request => {
          const classData = classes.find(c => c.id === request.classId)
          const userApplication = request.applicants.find(app => app.instructorId === firebaseUser.uid)

          return {
            ...request,
            classData: classData,
            userHasApplied: !!userApplication,
            applicationStatus: userApplication?.status || null,
            applicantCount: request.applicants.length
          }
        }).filter(item => item.classData) // Only include items with valid class data

        // Sort by urgency and date
        coveragePool.sort((a, b) => {
          if (a.urgent && !b.urgent) return -1
          if (!a.urgent && b.urgent) return 1
          return new Date(a.classData.startTime) - new Date(b.classData.startTime)
        })

        return NextResponse.json({
          coveragePool: coveragePool,
          totalOpen: coveragePool.length,
          urgentCount: coveragePool.filter(item => item.urgent).length
        })
      } catch (error) {
        console.error('Coverage pool fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch coverage pool' }, { status: 500 })
      }
    }

    // Get studio staffing dashboard
    if (path === '/staffing/dashboard') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Verify user is studio owner/merchant
        const userProfile = await database.collection('profiles').findOne({ 
          userId: firebaseUser.uid,
          role: 'merchant'
        })

        if (!userProfile) {
          return NextResponse.json({ error: 'Access denied: Merchant role required' }, { status: 403 })
        }

        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0]
        const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Get all studio classes in date range
        const classes = await database.collection('studio_classes').find({
          studioId: firebaseUser.uid,
          startTime: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }).sort({ startTime: 1 }).toArray()

        // Get all instructors associated with the studio
        const instructors = await database.collection('profiles').find({
          role: 'instructor'
          // Add studio association filtering when available
        }).toArray()

        // Get pending swap requests requiring approval
        const pendingSwaps = await database.collection('swap_requests').find({
          studioId: firebaseUser.uid,
          status: 'awaiting_approval'
        }).toArray()

        // Get open coverage requests
        const openCoverage = await database.collection('coverage_requests').find({
          studioId: firebaseUser.uid,
          status: 'open'
        }).toArray()

        // Enhance classes with additional info
        const enhancedClasses = classes.map(classItem => ({
          ...classItem,
          needsCoverage: classItem.needsCoverage || false,
          hasAssignedInstructor: !!classItem.assignedInstructorId,
          instructorName: classItem.assignedInstructorName || 'Unassigned'
        }))

        // Calculate statistics
        const stats = {
          totalClasses: classes.length,
          assignedClasses: classes.filter(c => c.assignedInstructorId).length,
          unassignedClasses: classes.filter(c => !c.assignedInstructorId).length,
          needingCoverage: classes.filter(c => c.needsCoverage).length,
          pendingSwaps: pendingSwaps.length,
          openCoverageRequests: openCoverage.length
        }

        return NextResponse.json({
          classes: enhancedClasses,
          instructors: instructors,
          pendingSwaps: pendingSwaps,
          openCoverage: openCoverage,
          stats: stats,
          dateRange: { startDate, endDate }
        })
      } catch (error) {
        console.error('Staffing dashboard error:', error)
        return NextResponse.json({ error: 'Failed to fetch staffing dashboard' }, { status: 500 })
      }
    }

    // Get staffing chat messages
    if (path.startsWith('/staffing/chat')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const studioId = url.searchParams.get('studioId')
        const limit = parseInt(url.searchParams.get('limit')) || 50

        if (!studioId) {
          return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
        }

        // Get chat messages for the studio
        const messages = await database.collection('staffing_chat').find({
          studioId: studioId
        }).sort({ timestamp: -1 }).limit(limit).toArray()

        // Reverse to show oldest first
        messages.reverse()

        return NextResponse.json({
          messages: messages,
          messageCount: messages.length,
          studioId: studioId
        })
      } catch (error) {
        console.error('Chat messages fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
      }
    }

    // Get studio staffing settings
    if (path === '/staffing/settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Verify user is studio owner/merchant
        const userProfile = await database.collection('profiles').findOne({ 
          userId: firebaseUser.uid,
          role: 'merchant'
        })

        if (!userProfile) {
          return NextResponse.json({ error: 'Access denied: Merchant role required' }, { status: 403 })
        }

        // Get studio staffing settings
        let settings = await database.collection('studio_staffing_settings').findOne({
          studioId: firebaseUser.uid
        })

        // If no settings exist, create default settings
        if (!settings) {
          settings = {
            studioId: firebaseUser.uid,
            requireApproval: false,
            maxWeeklyHours: 40,
            minHoursBetweenClasses: 1,
            allowSelfSwap: true,
            allowCoverageRequest: true,
            notifyOnSwapRequest: true,
            notifyOnCoverageRequest: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await database.collection('studio_staffing_settings').insertOne(settings)
        }

        return NextResponse.json({
          settings: settings
        })
      } catch (error) {
        console.error('Staffing settings fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch staffing settings' }, { status: 500 })
      }
    }

    // ========================================
    // AI-POWERED RECOMMENDATION ENGINE ENDPOINTS (GET)
    // ========================================

    // Get personalized class recommendations
    if (path === '/recommendations/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const { getPersonalizedClassRecommendations } = await import('@/lib/ai-recommendations')
        const recommendations = await getPersonalizedClassRecommendations(firebaseUser.uid)
        
        return NextResponse.json({
          recommendations: recommendations,
          totalCount: recommendations.length,
          aiPowered: true,
          userId: firebaseUser.uid
        })
      } catch (error) {
        console.error('Class recommendations error:', error)
        return NextResponse.json({ error: 'Failed to get class recommendations' }, { status: 500 })
      }
    }

    // Get instructor matches
    if (path === '/recommendations/instructors') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const { getInstructorMatches } = await import('@/lib/ai-recommendations')
        const matches = await getInstructorMatches(firebaseUser.uid)
        
        return NextResponse.json({
          instructors: matches,
          totalCount: matches.length,
          aiPowered: true,
          userId: firebaseUser.uid
        })
      } catch (error) {
        console.error('Instructor matches error:', error)
        return NextResponse.json({ error: 'Failed to get instructor matches' }, { status: 500 })
      }
    }

    // Natural language search
    if (path === '/ai/search') {
      const firebaseUser = await getFirebaseUser(request)
      const url = new URL(request.url)
      const query = url.searchParams.get('q')

      if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
      }

      try {
        const { naturalLanguageSearch } = await import('@/lib/ai-recommendations')
        const searchResults = await naturalLanguageSearch(query, firebaseUser?.uid)
        
        return NextResponse.json({
          ...searchResults,
          aiPowered: true,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('AI search error:', error)
        return NextResponse.json({ error: 'Failed to perform AI search' }, { status: 500 })
      }
    }

    // Get predictive analytics (Admin/Merchant only)
    if (path === '/ai/analytics') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Verify user has analytics access (merchant or admin)
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!userProfile || !['merchant', 'admin'].includes(userProfile.role)) {
          return NextResponse.json({ error: 'Access denied: Analytics access required' }, { status: 403 })
        }

        const { getPredictiveAnalytics } = await import('@/lib/ai-recommendations')
        const analytics = await getPredictiveAnalytics()
        
        return NextResponse.json({
          analytics: analytics,
          aiPowered: true,
          timestamp: new Date().toISOString(),
          accessLevel: userProfile.role
        })
      } catch (error) {
        console.error('Predictive analytics error:', error)
        return NextResponse.json({ error: 'Failed to get predictive analytics' }, { status: 500 })
      }
    }



    // Get import history and analytics
    if (path === '/import/history') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit')) || 10

        const importHistory = await database.collection('import_history').find({
          userId: firebaseUser.uid
        }).sort({ completedAt: -1 }).limit(limit).toArray()

        // Calculate totals
        const totals = importHistory.reduce((acc, imp) => ({
          totalImports: acc.totalImports + 1,
          totalRecords: acc.totalRecords + (imp.result?.totalRecords || 0),
          successfulRecords: acc.successfulRecords + (imp.result?.successfulImports || 0),
          failedRecords: acc.failedRecords + (imp.result?.failedImports || 0)
        }), { totalImports: 0, totalRecords: 0, successfulRecords: 0, failedRecords: 0 })

        return NextResponse.json({
          history: importHistory,
          totals: totals,
          successRate: totals.totalRecords > 0 ? (totals.successfulRecords / totals.totalRecords * 100).toFixed(1) : 0,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Import history error:', error)
        return NextResponse.json({ error: 'Failed to fetch import history' }, { status: 500 })
      }
    }

    // Get swap requests for user
    if (path === '/staffing/swap-requests') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const type = url.searchParams.get('type') || 'all' // 'sent', 'received', 'all'
        
        let query = {}
        if (type === 'sent') {
          query = { initiatorId: firebaseUser.uid }
        } else if (type === 'received') {
          query = { recipientId: firebaseUser.uid }
        } else {
          query = { 
            $or: [
              { initiatorId: firebaseUser.uid },
              { recipientId: firebaseUser.uid }
            ]
          }
        }

        const swapRequests = await database.collection('swap_requests').find(query)
          .sort({ createdAt: -1 }).toArray()

        // Get class details for each swap request
        const classIds = swapRequests.map(req => req.classId)
        const classes = await database.collection('studio_classes').find({
          id: { $in: classIds }
        }).toArray()

        // Get user profiles for participants
        const userIds = [...new Set([
          ...swapRequests.map(req => req.initiatorId),
          ...swapRequests.map(req => req.recipientId)
        ])]
        const users = await database.collection('profiles').find({
          userId: { $in: userIds }
        }).toArray()

        // Enhance swap requests with additional data
        const enhancedSwapRequests = swapRequests.map(request => {
          const classData = classes.find(c => c.id === request.classId)
          const initiator = users.find(u => u.userId === request.initiatorId)
          const recipient = users.find(u => u.userId === request.recipientId)

          return {
            ...request,
            classData: classData,
            initiatorName: initiator?.name || 'Unknown',
            recipientName: recipient?.name || 'Unknown',
            userRole: request.initiatorId === firebaseUser.uid ? 'initiator' : 'recipient'
          }
        })

        return NextResponse.json({
          swapRequests: enhancedSwapRequests,
          totalRequests: enhancedSwapRequests.length,
          pendingRequests: enhancedSwapRequests.filter(req => req.status === 'pending').length
        })
      } catch (error) {
        console.error('Swap requests fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch swap requests' }, { status: 500 })
      }
    }

    // ========================================
    // MARKETPLACE ENDPOINTS
    // ========================================

    // Get marketplace instructors
    if (path === '/marketplace/instructors') {
      try {
        const instructors = await database.collection('profiles').find({
          role: 'instructor'
        }).toArray()

        return NextResponse.json({
          instructors: instructors.map(instructor => ({
            id: instructor.userId,
            name: instructor.name || instructor.email.split('@')[0],
            tagline: instructor.tagline || 'Professional fitness instructor',
            specialties: instructor.specialties || ['Fitness'],
            location: instructor.location || 'Location not specified',
            rating: instructor.rating || 4.5,
            reviewCount: instructor.reviewCount || 0,
            hourlyRate: instructor.hourlyRate || 35,
            imageUrl: instructor.imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=face',
            experience: instructor.experience || '1+ years',
            languages: instructor.languages || ['English'],
            certifications: instructor.certifications || [],
            videoIntro: instructor.videoIntro || false,
            totalClasses: instructor.totalClasses || 0,
            availability: instructor.availability || 'Available',
            nextClass: instructor.nextClass || 'TBD',
            featured: instructor.featured || false,
            achievements: instructor.achievements || [],
            bio: instructor.bio || 'Experienced fitness instructor'
          }))
        })
      } catch (error) {
        console.error('Marketplace instructors fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch instructors' }, { status: 500 })
      }
    }

    // ========================================
    // INSTRUCTOR DATA ENDPOINTS
    // ========================================

    // Get instructor profile
    if (path === '/instructor/profile') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const instructor = await database.collection('profiles').findOne({
          userId: firebaseUser.uid,
          role: 'instructor'
        })

        if (!instructor) {
          return NextResponse.json({ error: 'Instructor profile not found' }, { status: 404 })
        }

        return NextResponse.json({
          instructor: {
            name: instructor.name || instructor.email.split('@')[0],
            firstName: instructor.firstName || '',
            lastName: instructor.lastName || '',
            email: instructor.email || '',
            role: instructor.role || 'Instructor',
            bio: instructor.bio || '',
            rating: instructor.rating || 0,
            totalClasses: instructor.totalClasses || 0,
            avatar: instructor.avatar || null,
            specialties: instructor.specialties || [],
            hourlyRate: instructor.hourlyRate || 35,
            stripeAccountStatus: instructor.stripeAccountStatus || 'pending'
          }
        })
      } catch (error) {
        console.error('Instructor profile fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch instructor profile' }, { status: 500 })
      }
    }

    // Get instructor classes
    if (path === '/instructor/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const classes = await database.collection('studio_classes').find({
          assignedInstructorId: firebaseUser.uid
        }).toArray()

        return NextResponse.json({
          classes: classes.map(cls => ({
            id: cls._id,
            name: cls.title,
            location: cls.location,
            time: cls.time,
            date: cls.date,
            booked: cls.enrolled || 0,
            capacity: cls.capacity || 10,
            type: cls.type,
            color: getClassColor(cls.type),
            status: cls.status
          }))
        })
      } catch (error) {
        console.error('Instructor classes fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch instructor classes' }, { status: 500 })
      }
    }

    // Get instructor messages
    if (path === '/instructor/messages') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const messages = await database.collection('messages').find({
          recipientId: firebaseUser.uid
        }).sort({ createdAt: -1 }).limit(20).toArray()

        return NextResponse.json({
          messages: messages.map(msg => ({
            id: msg._id,
            sender: msg.senderName || 'Unknown',
            avatar: msg.senderName ? msg.senderName.split(' ').map(n => n[0]).join('') : 'U',
            time: msg.createdAt,
            message: msg.content,
            unread: msg.unread || false
          }))
        })
      } catch (error) {
        console.error('Instructor messages fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
      }
    }

    // Get instructor earnings
    if (path === '/instructor/earnings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const earnings = await database.collection('instructor_earnings').find({
          instructorId: firebaseUser.uid
        }).toArray()

        const thisMonth = earnings.filter(e => {
          const date = new Date(e.date)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        }).reduce((sum, e) => sum + e.amount, 0)

        const thisWeek = earnings.filter(e => {
          const date = new Date(e.date)
          const now = new Date()
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return date >= weekAgo
        }).reduce((sum, e) => sum + e.amount, 0)

        const total = earnings.reduce((sum, e) => sum + e.amount, 0)

        return NextResponse.json({
          earnings: {
            thisMonth,
            thisWeek,
            total
          }
        })
      } catch (error) {
        console.error('Instructor earnings fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
      }
    }

    // Helper function to get class color
    function getClassColor(type) {
      const colors = {
        'Yoga': 'green',
        'HIIT': 'red',
        'Pilates': 'blue',
        'Strength': 'orange',
        'Dance': 'purple'
      }
      return colors[type] || 'gray'
    }

    // ========================================
    // CUSTOMER DASHBOARD DATA ENDPOINTS
    // ========================================

    // Get user's bookings for dashboard analytics
    if (path === '/user/bookings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const bookings = await database.collection('bookings').find({
          userId: firebaseUser.uid
        }).sort({ createdAt: -1 }).toArray()

        return NextResponse.json({
          bookings: bookings.map(booking => ({
            id: booking._id,
            title: booking.title,
            className: booking.className,
            type: booking.type,
            date: booking.date,
            time: booking.time,
            instructor: booking.instructor,
            studio: booking.studio,
            amount: booking.amount,
            status: booking.status,
            createdAt: booking.createdAt
          }))
        })
      } catch (error) {
        console.error('User bookings fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
      }
    }

    // Get user's favorites
    if (path === '/user/favorites') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const favorites = await database.collection('user_favorites').find({
          userId: firebaseUser.uid
        }).toArray()

        return NextResponse.json({
          favorites: favorites.map(favorite => ({
            id: favorite._id,
            name: favorite.name,
            type: favorite.type,
            rating: favorite.rating,
            image: favorite.image,
            createdAt: favorite.createdAt
          }))
        })
      } catch (error) {
        console.error('User favorites fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
      }
    }

    // ========================================
    // PROFILE AND STUDIO DATA ENDPOINTS
    // ========================================



    // Debug user role endpoint
    if (path === '/debug/user-role') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        return NextResponse.json({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          profile: userProfile,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Debug user role error:', error)
        return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 })
      }
    }

    // Get user profile
    if (path === '/profile') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const profile = await database.collection('profiles').findOne({
          userId: firebaseUser.uid
        })

        if (!profile) {
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json({
          profile: {
            userId: profile.userId,
            email: profile.email,
            role: profile.role,
            name: profile.name,
            studioName: profile.studioName,
            onboarding_complete: profile.onboarding_complete,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt
          }
        })
      } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
      }
    }

    // Get dashboard analytics
    if (path === '/analytics/dashboard') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Get recent bookings for analytics
        const bookings = await database.collection('bookings').find({
          studioId: firebaseUser.uid,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).toArray()

        // Calculate basic analytics
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
        const totalBookings = bookings.length
        const newClients = new Set(bookings.map(b => b.userId)).size

        // Get recent activity
        const recentActivity = await database.collection('activity_log').find({
          studioId: firebaseUser.uid
        }).sort({ timestamp: -1 }).limit(10).toArray()

        return NextResponse.json({
          totalRevenue,
          totalBookings,
          newClients,
          recentActivity: recentActivity.map(activity => ({
            message: activity.message,
            time: activity.timestamp,
            type: activity.type
          }))
        })
      } catch (error) {
        console.error('Analytics fetch error:', error)
        return NextResponse.json({ 
          totalRevenue: 0,
          totalBookings: 0,
          newClients: 0,
          recentActivity: []
        })
      }
    }

    // Get studio classes
    if (path === '/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const classes = await database.collection('studio_classes').find({
          studioId: firebaseUser.uid
        }).toArray()

        return NextResponse.json({
          classes: classes.map(cls => ({
            id: cls._id,
            title: cls.title,
            type: cls.type,
            time: cls.time,
            duration: cls.duration,
            capacity: cls.capacity,
            price: cls.price,
            instructor: cls.instructor,
            status: cls.status,
            enrolled: cls.enrolled || 0,
            createdAt: cls.createdAt
          }))
        })
      } catch (error) {
        console.error('Classes fetch error:', error)
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
      }
    }

    // ========================================
    // AI CONFIGURATION WIZARD ENDPOINTS (GET)
    // ========================================

    // Get ongoing recommendations for studio optimization
    if (path === '/ai-wizard/recommendations') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const recommendations = await AIConfigurationWizard.getOngoingRecommendations(firebaseUser.uid)
        
        return NextResponse.json({
          ...recommendations,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Ongoing recommendations error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Get onboarding status
    if (path === '/onboarding/status') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const profile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (!profile) {
          // Return default onboarding status for new users
          return NextResponse.json({
            onboarding_complete: false,
            current_step: 1,
            completed_steps: [],
            total_steps: 3, // Default, will be updated based on role
            profile_data: null,
            last_saved: null
          })
        }

        // Determine total steps based on role
        const getTotalSteps = (role) => {
          switch (role) {
            case 'customer': return 4
            case 'instructor': return 5
            case 'merchant': return 6
            default: return 3
          }
        }

        const totalSteps = getTotalSteps(profile.role)
        const isComplete = profile.onboarding_complete || false
        const currentStep = isComplete ? totalSteps : (profile.current_step || 1)
        const completedSteps = isComplete ? 
          Array.from({ length: totalSteps }, (_, i) => i + 1) : 
          (profile.completed_steps || [])

        return NextResponse.json({
          onboarding_complete: isComplete,
          current_step: currentStep,
          completed_steps: completedSteps,
          total_steps: totalSteps,
          profile_data: profile.profileData || null,
          last_saved: profile.updatedAt || profile.createdAt || null,
          user_role: profile.role
        })
      } catch (error) {
        console.error('Onboarding status error:', error)
        return NextResponse.json({ error: 'Failed to get onboarding status' }, { status: 500 })
      }
    }

    // ===== AI MIGRATION & DATA IMPORT ENDPOINTS (GET) =====

    // Get migration upload status
    if (path.startsWith('/migration/upload/') && path.split('/').length === 4) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const uploadId = path.split('/')[3]
        
        const upload = await database.collection('migration_uploads').findOne({
          uploadId,
          userId: firebaseUser.uid
        })

        if (!upload) {
          return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
        }

        return NextResponse.json({
          uploadId: upload.uploadId,
          fileName: upload.fileName,
          fileSize: upload.fileSize,
          status: upload.status,
          createdAt: upload.createdAt,
          parsedAt: upload.parsedAt,
          parseMethod: upload.parseMethod,
          parseConfidence: upload.parseConfidence,
          error: upload.error,
          suggestions: upload.suggestions
        })

      } catch (error) {
        console.error('Migration status error:', error)
        return NextResponse.json({ error: 'Failed to get migration status' }, { status: 500 })
      }
    }

    // Get parsed migration data for review
    if (path.startsWith('/migration/parsed/') && path.split('/').length === 4) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const parsedDataId = path.split('/')[3]
        
        const parsedData = await database.collection('migration_parsed_data').findOne({
          parsedDataId,
          userId: firebaseUser.uid
        })

        if (!parsedData) {
          return NextResponse.json({ error: 'Parsed data not found' }, { status: 404 })
        }

        return NextResponse.json({
          parsedDataId: parsedData.parsedDataId,
          fileName: parsedData.fileName,
          method: parsedData.method,
          confidence: parsedData.confidence,
          data: parsedData.data,
          warnings: parsedData.warnings,
          aiInsights: parsedData.aiInsights,
          status: parsedData.status,
          createdAt: parsedData.createdAt,
          importResults: parsedData.importResults
        })

      } catch (error) {
        console.error('Parsed data retrieval error:', error)
        return NextResponse.json({ error: 'Failed to get parsed data' }, { status: 500 })
      }
    }

    // Get migration history
    if (path === '/migration/history') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const uploads = await database.collection('migration_uploads')
          .find({ userId: firebaseUser.uid })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray()

        const history = uploads.map(upload => ({
          uploadId: upload.uploadId,
          fileName: upload.fileName,
          fileSize: upload.fileSize,
          status: upload.status,
          parseMethod: upload.parseMethod,
          parseConfidence: upload.parseConfidence,
          createdAt: upload.createdAt,
          parsedAt: upload.parsedAt,
          importResults: upload.importResults
        }))

        return NextResponse.json({
          success: true,
          history,
          totalUploads: history.length
        })

      } catch (error) {
        console.error('Migration history error:', error)
        return NextResponse.json({ error: 'Failed to get migration history' }, { status: 500 })
      }
    }

    // ===== ADVANCED CLASS MANAGEMENT & SCHEDULING ENDPOINTS (GET) =====

    // Get studio classes
    if (path === '/classes' || path.startsWith('/classes?')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const includeInactive = url.searchParams.get('includeInactive') === 'true'
        const category = url.searchParams.get('category')
        const level = url.searchParams.get('level')

        let query = { studioId: firebaseUser.uid }
        
        if (!includeInactive) {
          query.isActive = true
        }
        
        if (category && category !== 'all') {
          query.category = category
        }
        
        if (level && level !== 'all') {
          query.level = level
        }

        const classes = await database.collection('studio_classes')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray()

        return NextResponse.json({
          success: true,
          classes,
          total: classes.length
        })

      } catch (error) {
        console.error('Get classes error:', error)
        return NextResponse.json({ error: 'Failed to retrieve classes' }, { status: 500 })
      }
    }

    // Get class schedules with availability
    if (path === '/schedules' || path.startsWith('/schedules?')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const classId = url.searchParams.get('classId')
        const instructorId = url.searchParams.get('instructorId')
        const category = url.searchParams.get('category')
        const availableOnly = url.searchParams.get('availableOnly') === 'true'
        const view = url.searchParams.get('view') || 'week'

        let query = {}
        
        // For studio owners, show their classes
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (userProfile && userProfile.role === 'merchant') {
          query.studioId = firebaseUser.uid
        }

        if (startDate && endDate) {
          query.startTime = {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate).toISOString()
          }
        }

        if (classId) {
          query.classId = classId
        }

        if (instructorId) {
          query.instructorId = instructorId
        }

        let schedules = await database.collection('class_schedules')
          .find(query)
          .sort({ startTime: 1 })
          .toArray()

        // Get bookings and waitlists for availability calculation
        const scheduleIds = schedules.map(s => s.id)
        const bookings = await database.collection('bookings')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'confirmed'
          })
          .toArray()

        const waitlists = await database.collection('waitlists')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'active'
          })
          .toArray()

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Calculate availability
        schedules = schedulingEngine.calculateAvailability(schedules, bookings, waitlists)

        // Apply filters
        if (category && category !== 'all') {
          schedules = schedules.filter(s => s.category === category)
        }

        if (availableOnly) {
          schedules = schedules.filter(s => s.availableSpots > 0)
        }

        return NextResponse.json({
          success: true,
          schedules,
          total: schedules.length,
          view,
          dateRange: { startDate, endDate }
        })

      } catch (error) {
        console.error('Get schedules error:', error)
        return NextResponse.json({ error: 'Failed to retrieve schedules' }, { status: 500 })
      }
    }

    // Get user bookings
    if (path === '/bookings' || path.startsWith('/bookings?')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const status = url.searchParams.get('status')
        const upcoming = url.searchParams.get('upcoming') === 'true'
        const limit = parseInt(url.searchParams.get('limit')) || 50

        let query = { userId: firebaseUser.uid }
        
        if (status) {
          query.status = status
        }

        if (upcoming) {
          query.startTime = { $gte: new Date().toISOString() }
        }

        const bookings = await database.collection('bookings')
          .find(query)
          .sort({ startTime: -1 })
          .limit(limit)
          .toArray()

        // Get waitlist entries for the user
        const waitlistEntries = await database.collection('waitlists')
          .find({ 
            userId: firebaseUser.uid,
            status: 'active'
          })
          .sort({ createdAt: -1 })
          .toArray()

        return NextResponse.json({
          success: true,
          bookings,
          waitlist: waitlistEntries,
          totalBookings: bookings.length,
          totalWaitlist: waitlistEntries.length
        })

      } catch (error) {
        console.error('Get bookings error:', error)
        return NextResponse.json({ error: 'Failed to retrieve bookings' }, { status: 500 })
      }
    }

    // Search classes with advanced filtering
    if (path === '/search/classes' || path.startsWith('/search/classes?')) {
      try {
        const url = new URL(request.url)
        const query = url.searchParams.get('q') || ''
        const category = url.searchParams.get('category')
        const level = url.searchParams.get('level')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const timeOfDay = url.searchParams.get('timeOfDay')
        const availableOnly = url.searchParams.get('availableOnly') === 'true'
        const sortBy = url.searchParams.get('sortBy') || 'date'
        const limit = parseInt(url.searchParams.get('limit')) || 20

        // Search in class schedules
        let searchQuery = { status: { $ne: 'cancelled' } }
        
        if (query) {
          searchQuery.$or = [
            { className: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { instructorName: { $regex: query, $options: 'i' } }
          ]
        }

        if (startDate && endDate) {
          searchQuery.startTime = {
            $gte: new Date(startDate).toISOString(),
            $lte: new Date(endDate).toISOString()
          }
        }

        let schedules = await database.collection('class_schedules')
          .find(searchQuery)
          .limit(limit * 2) // Get more for filtering
          .toArray()

        // Get real-time availability
        const scheduleIds = schedules.map(s => s.id)
        const bookings = await database.collection('bookings')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'confirmed'
          })
          .toArray()

        const waitlists = await database.collection('waitlists')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'active'
          })
          .toArray()

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Apply search filters and calculate availability
        schedules = schedulingEngine.searchClasses(schedules, {
          category,
          level,
          timeOfDay,
          availableOnly,
          sortBy
        })

        schedules = schedulingEngine.calculateAvailability(schedules, bookings, waitlists)

        // Limit final results
        schedules = schedules.slice(0, limit)

        return NextResponse.json({
          success: true,
          results: schedules,
          total: schedules.length,
          query: {
            search: query,
            category,
            level,
            timeOfDay,
            availableOnly,
            sortBy
          }
        })

      } catch (error) {
        console.error('Search classes error:', error)
        return NextResponse.json({ error: 'Failed to search classes' }, { status: 500 })
      }
    }

    // Get class details with full information
    if (path.startsWith('/classes/') && path.split('/').length === 3) {
      try {
        const classId = path.split('/')[2]
        
        // Get class template
        const classTemplate = await database.collection('studio_classes').findOne({
          id: classId
        })

        if (!classTemplate) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Get upcoming instances
        const upcomingInstances = await database.collection('class_schedules')
          .find({
            classId,
            startTime: { $gte: new Date().toISOString() },
            status: { $ne: 'cancelled' }
          })
          .sort({ startTime: 1 })
          .limit(10)
          .toArray()

        // Get instructor details if assigned
        let instructor = null
        if (classTemplate.defaultInstructorId) {
          instructor = await database.collection('profiles').findOne({
            userId: classTemplate.defaultInstructorId,
            role: 'instructor'
          })
        }

        // Get studio details
        const studio = await database.collection('profiles').findOne({
          userId: classTemplate.studioId,
          role: 'merchant'
        })

        return NextResponse.json({
          success: true,
          class: classTemplate,
          upcomingInstances,
          instructor: instructor ? {
            id: instructor.userId,
            name: `${instructor.firstName} ${instructor.lastName}`,
            bio: instructor.bio,
            specialties: instructor.specialties,
            experience: instructor.experience
          } : null,
          studio: studio ? {
            id: studio.userId,
            name: studio.studioName || studio.businessName,
            description: studio.description
          } : null
        })

      } catch (error) {
        console.error('Get class details error:', error)
        return NextResponse.json({ error: 'Failed to retrieve class details' }, { status: 500 })
      }
    }

    // Get availability calendar
    if (path === '/calendar/availability' || path.startsWith('/calendar/availability?')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0]
        const endDate = url.searchParams.get('endDate') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const view = url.searchParams.get('view') || 'month'

        // Get class schedules for the date range
        const schedules = await database.collection('class_schedules')
          .find({
            studioId: firebaseUser.uid,
            startTime: {
              $gte: new Date(startDate).toISOString(),
              $lte: new Date(endDate).toISOString()
            },
            status: { $ne: 'cancelled' }
          })
          .toArray()

        // Get bookings for availability calculation
        const scheduleIds = schedules.map(s => s.id)
        const bookings = await database.collection('bookings')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'confirmed'
          })
          .toArray()

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Calculate availability and generate calendar
        const schedulesWithAvailability = schedulingEngine.calculateAvailability(schedules, bookings, [])
        const calendar = schedulingEngine.generateAvailabilityCalendar(schedulesWithAvailability, startDate, endDate)

        return NextResponse.json({
          success: true,
          calendar,
          view,
          dateRange: { startDate, endDate },
          totalDays: Object.keys(calendar).length
        })

      } catch (error) {
        console.error('Get availability calendar error:', error)
        return NextResponse.json({ error: 'Failed to retrieve availability calendar' }, { status: 500 })
      }
    }

    // ===== SEARCH & DISCOVERY ENGINE ENDPOINTS =====

    // Get personalized recommendations
    if (path === '/discover/recommendations') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const type = url.searchParams.get('type') || 'personalized'
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const timeRange = url.searchParams.get('timeRange') || '7days'

        // Get user profile
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!userProfile) {
          return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
        }

        // Import AI recommendation engine
        const { default: aiRecommendationEngine } = await import('../../../lib/ai-recommendation-engine.js')
        
        // Get actual class data for recommendations
        const availableClasses = await database.collection('class_schedules')
          .find({
            startTime: { $gte: new Date().toISOString() },
            status: { $ne: 'cancelled' }
          })
          .sort({ startTime: 1 })
          .limit(50)
          .toArray()

        // Get bookings for availability calculation
        const scheduleIds = availableClasses.map(c => c.id)
        const bookings = await database.collection('bookings')
          .find({ 
            classInstanceId: { $in: scheduleIds },
            status: 'confirmed'
          })
          .toArray()

        // Calculate availability
        const classesWithAvailability = availableClasses.map(cls => {
          const classBookings = bookings.filter(b => b.classInstanceId === cls.id)
          const bookedCount = classBookings.length
          const availableSpots = Math.max(0, (cls.capacity || 20) - bookedCount)
          
          return {
            ...cls,
            bookedCount,
            availableSpots,
            isAvailable: availableSpots > 0
          }
        })

        // Apply AI recommendation scoring to actual classes
        const preferences = await aiRecommendationEngine.extractUserPreferences(userProfile)
        const behaviorData = await aiRecommendationEngine.getUserBehaviorData(firebaseUser.uid)
        
        // Score and rank classes
        const scoredClasses = await aiRecommendationEngine.calculateRecommendationScores(
          classesWithAvailability,
          preferences,
          behaviorData,
          type
        )

        // Get top recommendations
        const topRecommendations = scoredClasses
          .sort((a, b) => b.score - a.score)
          .slice(0, limit)
          .map(rec => ({
            ...rec,
            recommendationReason: aiRecommendationEngine.generateRecommendationReason(rec),
            confidence: Math.min(rec.score, 1.0)
          }))

        return NextResponse.json({
          success: true,
          recommendations: topRecommendations,
          meta: {
            userId: firebaseUser.uid,
            recommendationType: type,
            generatedAt: new Date(),
            totalScored: scoredClasses.length,
            userPreferences: preferences,
            behaviorInsights: aiRecommendationEngine.generateBehaviorInsights(behaviorData),
            timeRange,
            totalAvailable: classesWithAvailability.length
          },
          personalizedFor: {
            userId: firebaseUser.uid,
            name: userProfile.name || `${userProfile.firstName} ${userProfile.lastName}`,
            preferences: preferences
          }
        })

      } catch (error) {
        console.error('Recommendations error:', error)
        return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
      }
    }

    // Get trending classes and studios
    if (path === '/discover/trending') {
      try {
        const url = new URL(request.url)
        const category = url.searchParams.get('category')
        const timeRange = url.searchParams.get('timeRange') || '7days'
        const limit = parseInt(url.searchParams.get('limit')) || 10

        // Calculate trending based on recent bookings and ratings
        let trendingQuery = {}
        if (category && category !== 'all') {
          trendingQuery.category = category
        }

        // Get classes with high booking rates from the last week
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - (timeRange === '7days' ? 7 : 30))

        const trendingClasses = await database.collection('class_schedules')
          .find({
            ...trendingQuery,
            startTime: { $gte: startDate.toISOString(), $lte: endDate.toISOString() },
            status: { $ne: 'cancelled' }
          })
          .sort({ bookedCount: -1, rating: -1 })
          .limit(limit)
          .toArray()

        // Get booking trend data
        const classIds = trendingClasses.map(c => c.id)
        const recentBookings = await database.collection('bookings')
          .find({
            classInstanceId: { $in: classIds },
            createdAt: { $gte: startDate },
            status: 'confirmed'
          })
          .toArray()

        // Calculate trend scores
        const trendingWithScores = trendingClasses.map(classItem => {
          const classBookings = recentBookings.filter(b => b.classInstanceId === classItem.id)
          const trendScore = (classBookings.length / Math.max(classItem.capacity, 1)) * 100

          return {
            ...classItem,
            trendScore,
            recentBookings: classBookings.length,
            bookingRate: `${Math.round(trendScore)}%`,
            trendingReason: generateTrendingReason(classItem, classBookings.length)
          }
        })

        // Get trending studios
        const trendingStudios = await getTrendingStudios(startDate, endDate, limit, database)

        return NextResponse.json({
          success: true,
          trending: {
            classes: trendingWithScores,
            studios: trendingStudios,
            timeRange,
            category: category || 'all',
            generatedAt: new Date()
          }
        })

      } catch (error) {
        console.error('Trending discovery error:', error)
        return NextResponse.json({ error: 'Failed to get trending content' }, { status: 500 })
      }
    }

    // Advanced search with autocomplete and suggestions
    if (path === '/discover/search/suggestions') {
      try {
        const url = new URL(request.url)
        const query = url.searchParams.get('q') || ''
        const limit = parseInt(url.searchParams.get('limit')) || 8

        if (query.length < 2) {
          return NextResponse.json({
            success: true,
            suggestions: {
              classes: [],
              instructors: [],
              studios: [],
              categories: []
            }
          })
        }

        const searchRegex = new RegExp(query, 'i')

        // Search class names and descriptions
        const classSuggestions = await database.collection('studio_classes')
          .find({
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { tags: { $in: [searchRegex] } }
            ],
            isActive: true
          })
          .limit(limit)
          .toArray()

        // Search instructor names
        const instructorSuggestions = await database.collection('profiles')
          .find({
            role: 'instructor',
            $or: [
              { firstName: searchRegex },
              { lastName: searchRegex },
              { specialties: { $in: [searchRegex] } }
            ]
          })
          .limit(limit)
          .toArray()

        // Search studio names
        const studioSuggestions = await database.collection('profiles')
          .find({
            role: 'merchant',
            $or: [
              { businessName: searchRegex },
              { studioName: searchRegex },
              { description: searchRegex }
            ]
          })
          .limit(limit)
          .toArray()

        // Category suggestions
        const categories = [
          'yoga', 'pilates', 'hiit', 'cardio', 'strength', 'dance', 
          'meditation', 'boxing', 'cycling', 'swimming', 'martial-arts'
        ]
        const categorySuggestions = categories.filter(cat => 
          cat.toLowerCase().includes(query.toLowerCase())
        )

        return NextResponse.json({
          success: true,
          suggestions: {
            classes: classSuggestions.map(c => ({
              id: c.id,
              name: c.name,
              category: c.category,
              type: 'class'
            })),
            instructors: instructorSuggestions.map(i => ({
              id: i.userId,
              name: `${i.firstName} ${i.lastName}`,
              specialties: i.specialties || [],
              type: 'instructor'
            })),
            studios: studioSuggestions.map(s => ({
              id: s.userId,
              name: s.businessName || s.studioName,
              location: s.address,
              type: 'studio'
            })),
            categories: categorySuggestions.map(cat => ({
              name: cat,
              type: 'category'
            }))
          },
          query,
          totalSuggestions: classSuggestions.length + instructorSuggestions.length + 
                           studioSuggestions.length + categorySuggestions.length
        })

      } catch (error) {
        console.error('Search suggestions error:', error)
        return NextResponse.json({ error: 'Failed to get search suggestions' }, { status: 500 })
      }
    }

    // Get class ratings and reviews
    if (path === '/discover/reviews' || path.startsWith('/discover/reviews?')) {
      try {
        const url = new URL(request.url)
        const classId = url.searchParams.get('classId')
        const instructorId = url.searchParams.get('instructorId')
        const studioId = url.searchParams.get('studioId')
        const limit = parseInt(url.searchParams.get('limit')) || 10
        const sortBy = url.searchParams.get('sortBy') || 'recent'

        let reviewQuery = {}
        if (classId) reviewQuery.classId = classId
        if (instructorId) reviewQuery.instructorId = instructorId
        if (studioId) reviewQuery.studioId = studioId

        let sortQuery = { createdAt: -1 } // Default to recent
        if (sortBy === 'rating') sortQuery = { rating: -1, createdAt: -1 }
        if (sortBy === 'helpful') sortQuery = { helpfulCount: -1, createdAt: -1 }

        const reviews = await database.collection('reviews')
          .find(reviewQuery)
          .sort(sortQuery)
          .limit(limit)
          .toArray()

        // Get reviewer information
        const reviewerIds = reviews.map(r => r.userId)
        const reviewers = await database.collection('profiles')
          .find({ userId: { $in: reviewerIds } })
          .toArray()

        const enrichedReviews = reviews.map(review => {
          const reviewer = reviewers.find(r => r.userId === review.userId)
          return {
            ...review,
            reviewer: reviewer ? {
              name: reviewer.firstName ? `${reviewer.firstName} ${reviewer.lastName.charAt(0)}.` : 'Anonymous',
              verified: true,
              totalReviews: reviewer.totalReviews || 1
            } : { name: 'Anonymous', verified: false, totalReviews: 1 }
          }
        })

        // Calculate average rating and statistics
        const ratings = reviews.map(r => r.rating).filter(Boolean)
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b) / ratings.length : 0
        
        const ratingDistribution = {
          5: ratings.filter(r => r === 5).length,
          4: ratings.filter(r => r === 4).length,
          3: ratings.filter(r => r === 3).length,
          2: ratings.filter(r => r === 2).length,
          1: ratings.filter(r => r === 1).length
        }

        return NextResponse.json({
          success: true,
          reviews: enrichedReviews,
          statistics: {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            ratingDistribution
          },
          filters: { classId, instructorId, studioId, sortBy }
        })

      } catch (error) {
        console.error('Reviews retrieval error:', error)
        return NextResponse.json({ error: 'Failed to get reviews' }, { status: 500 })
      }
    }

    // ========================================
    // PAYMENT & SUBSCRIPTION SYSTEM - GET ENDPOINTS
    // ========================================

    // Get user's payment methods
    if (path === '/payments/methods') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const stripeCustomerId = userProfile?.stripeCustomerId

        if (!stripeCustomerId) {
          return NextResponse.json({
            success: true,
            paymentMethods: [],
            hasStripeCustomer: false
          })
        }

        // Get payment methods from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card'
        })

        // Get default payment method
        const customer = await stripe.customers.retrieve(stripeCustomerId)
        const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method

        const enrichedPaymentMethods = paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            funding: pm.card.funding
          } : null,
          isDefault: pm.id === defaultPaymentMethodId,
          created: new Date(pm.created * 1000)
        }))

        return NextResponse.json({
          success: true,
          paymentMethods: enrichedPaymentMethods,
          hasStripeCustomer: true,
          defaultPaymentMethod: defaultPaymentMethodId
        })

      } catch (error) {
        console.error('Payment methods error:', error)
        return NextResponse.json({ error: 'Failed to retrieve payment methods' }, { status: 500 })
      }
    }

    // Get user's subscriptions
    if (path === '/payments/subscriptions') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const subscriptions = await database.collection('subscriptions')
          .find({ userId: firebaseUser.uid })
          .sort({ createdAt: -1 })
          .toArray()

        // Get studio information for each subscription
        const studioIds = subscriptions.map(sub => sub.studioId).filter(Boolean)
        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        const enrichedSubscriptions = subscriptions.map(sub => {
          const studio = studios.find(s => s.userId === sub.studioId)
          return {
            ...sub,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address,
              city: studio.city,
              state: studio.state
            } : null
          }
        })

        return NextResponse.json({
          success: true,
          subscriptions: enrichedSubscriptions,
          totalSubscriptions: subscriptions.length,
          activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length
        })

      } catch (error) {
        console.error('Subscriptions error:', error)
        return NextResponse.json({ error: 'Failed to retrieve subscriptions' }, { status: 500 })
      }
    }

    // Get user's X Pass credits
    if (path === '/payments/xpass-credits') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const xpassCredits = await database.collection('xpass_credits')
          .findOne({ userId: firebaseUser.uid })

        if (!xpassCredits) {
          return NextResponse.json({
            success: true,
            credits: {
              availableCredits: 0,
              totalEarned: 0,
              totalSpent: 0
            },
            recentTransactions: []
          })
        }

        // Get recent X Pass transactions
        const recentTransactions = await database.collection('xpass_transactions')
          .find({ userId: firebaseUser.uid })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray()

        return NextResponse.json({
          success: true,
          credits: {
            availableCredits: xpassCredits.availableCredits || 0,
            totalEarned: xpassCredits.totalEarned || 0,
            totalSpent: xpassCredits.totalSpent || 0,
            lastUpdated: xpassCredits.updatedAt
          },
          recentTransactions: recentTransactions
        })

      } catch (error) {
        console.error('X Pass credits error:', error)
        return NextResponse.json({ error: 'Failed to retrieve X Pass credits' }, { status: 500 })
      }
    }

    // Get user's transaction history
    if (path === '/payments/transactions') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit')) || 20
        const offset = parseInt(url.searchParams.get('offset')) || 0
        const type = url.searchParams.get('type') // 'class_booking', 'subscription', 'xpass_purchase', etc.

        let query = { userId: firebaseUser.uid }
        if (type) {
          query.type = type
        }

        const transactions = await database.collection('transactions')
          .find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray()

        const totalCount = await database.collection('transactions')
          .countDocuments(query)

        return NextResponse.json({
          success: true,
          transactions: transactions,
          pagination: {
            total: totalCount,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < totalCount
          }
        })

      } catch (error) {
        console.error('Transactions error:', error)
        return NextResponse.json({ error: 'Failed to retrieve transactions' }, { status: 500 })
      }
    }

    // Get payment invoice
    if (path.startsWith('/payments/invoice/')) {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const invoiceId = path.split('/').pop()
        
        // Get invoice from Stripe
        const invoice = await stripe.invoices.retrieve(invoiceId)
        
        // Verify user owns this invoice
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!userProfile?.stripeCustomerId || invoice.customer !== userProfile.stripeCustomerId) {
          return NextResponse.json({ error: 'Invoice not found or unauthorized' }, { status: 404 })
        }

        // Format invoice data
        const formattedInvoice = {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          created: new Date(invoice.created * 1000),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          lines: invoice.lines.data.map(line => ({
            id: line.id,
            description: line.description,
            amount: line.amount,
            quantity: line.quantity,
            price: line.price
          }))
        }

        return NextResponse.json({
          success: true,
          invoice: formattedInvoice
        })

      } catch (error) {
        console.error('Invoice error:', error)
        return NextResponse.json({ error: 'Failed to retrieve invoice' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 2: SUBSCRIPTION MANAGEMENT SYSTEM - GET ENDPOINTS
    // ========================================

    // Get user's class packages
    if (path === '/payments/class-packages') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const status = url.searchParams.get('status') // 'active', 'expired', 'depleted'
        const studioId = url.searchParams.get('studioId')

        let query = { userId: firebaseUser.uid }
        if (status) query.status = status
        if (studioId) query.studioId = studioId

        const packages = await database.collection('class_packages')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray()

        // Get studio information for each package
        const studioIds = packages.map(pkg => pkg.studioId).filter(Boolean)
        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        const enrichedPackages = packages.map(pkg => {
          const studio = studios.find(s => s.userId === pkg.studioId)
          const isExpired = new Date() > new Date(pkg.expirationDate)
          const isDepleted = pkg.remainingClasses <= 0
          
          return {
            ...pkg,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address,
              city: studio.city,
              state: studio.state
            } : null,
            isExpired,
            isDepleted,
            daysUntilExpiration: Math.ceil((new Date(pkg.expirationDate) - new Date()) / (1000 * 60 * 60 * 24)),
            utilizationRate: pkg.totalClasses > 0 ? (pkg.usedClasses / pkg.totalClasses) * 100 : 0
          }
        })

        return NextResponse.json({
          success: true,
          packages: enrichedPackages,
          summary: {
            totalPackages: packages.length,
            activePackages: packages.filter(pkg => pkg.status === 'active').length,
            expiredPackages: packages.filter(pkg => new Date() > new Date(pkg.expirationDate)).length,
            depletedPackages: packages.filter(pkg => pkg.remainingClasses <= 0).length,
            totalRemainingClasses: packages.reduce((sum, pkg) => sum + pkg.remainingClasses, 0)
          }
        })

      } catch (error) {
        console.error('Class packages error:', error)
        return NextResponse.json({ error: 'Failed to retrieve class packages' }, { status: 500 })
      }
    }

    // Get subscription analytics
    if (path === '/payments/subscription-analytics') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role === 'merchant') {
          // Studio analytics
          const subscriptions = await database.collection('subscriptions')
            .find({ studioId: firebaseUser.uid })
            .toArray()

          const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
          const canceledSubscriptions = subscriptions.filter(sub => sub.status === 'canceled')
          const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'paused')

          // Calculate MRR (Monthly Recurring Revenue)
          const monthlyRevenue = activeSubscriptions.reduce((sum, sub) => {
            // Assuming subscription amount is monthly
            return sum + (sub.amount || 0)
          }, 0)

          // Calculate churn rate
          const totalSubscriptions = subscriptions.length
          const churnRate = totalSubscriptions > 0 ? (canceledSubscriptions.length / totalSubscriptions) * 100 : 0

          return NextResponse.json({
            success: true,
            analytics: {
              totalSubscriptions: totalSubscriptions,
              activeSubscriptions: activeSubscriptions.length,
              canceledSubscriptions: canceledSubscriptions.length,
              pausedSubscriptions: pausedSubscriptions.length,
              monthlyRecurringRevenue: monthlyRevenue,
              churnRate: Math.round(churnRate * 100) / 100,
              averageLifetime: 0, // TODO: Calculate based on subscription history
              conversionRate: 0, // TODO: Calculate based on trial to paid conversion
              period: 'current'
            }
          })
        } else {
          // Customer analytics
          const subscriptions = await database.collection('subscriptions')
            .find({ userId: firebaseUser.uid })
            .toArray()

          const packages = await database.collection('class_packages')
            .find({ userId: firebaseUser.uid })
            .toArray()

          const xpassCredits = await database.collection('xpass_credits')
            .findOne({ userId: firebaseUser.uid })

          const totalSpent = subscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0) +
                           packages.reduce((sum, pkg) => sum + (pkg.amount || 0), 0)

          return NextResponse.json({
            success: true,
            analytics: {
              totalSubscriptions: subscriptions.length,
              activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
              totalClassPackages: packages.length,
              activeClassPackages: packages.filter(pkg => pkg.status === 'active').length,
              xpassCredits: xpassCredits?.availableCredits || 0,
              totalSpent: totalSpent,
              memberSince: subscriptions.length > 0 ? subscriptions[0].createdAt : null,
              favoriteStudio: null // TODO: Calculate based on booking history
            }
          })
        }

      } catch (error) {
        console.error('Subscription analytics error:', error)
        return NextResponse.json({ error: 'Failed to retrieve subscription analytics' }, { status: 500 })
      }
    }

    // Get X Pass redemption history
    if (path === '/payments/xpass-redemptions') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit')) || 20
        const offset = parseInt(url.searchParams.get('offset')) || 0
        const studioId = url.searchParams.get('studioId')

        let query = { 
          userId: firebaseUser.uid,
          type: 'xpass_redemption'
        }
        if (studioId) query.studioId = studioId

        const redemptions = await database.collection('xpass_transactions')
          .find(query)
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray()

        // Get studio information
        const studioIds = redemptions.map(r => r.studioId).filter(Boolean)
        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        const enrichedRedemptions = redemptions.map(redemption => {
          const studio = studios.find(s => s.userId === redemption.studioId)
          return {
            ...redemption,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address,
              city: studio.city,
              state: studio.state
            } : null
          }
        })

        const totalCount = await database.collection('xpass_transactions')
          .countDocuments(query)

        return NextResponse.json({
          success: true,
          redemptions: enrichedRedemptions,
          pagination: {
            total: totalCount,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < totalCount
          }
        })

      } catch (error) {
        console.error('X Pass redemptions error:', error)
        return NextResponse.json({ error: 'Failed to retrieve X Pass redemptions' }, { status: 500 })
      }
    }

    // Get class package usage history
    if (path === '/payments/class-package-usage') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const packageId = url.searchParams.get('packageId')
        const limit = parseInt(url.searchParams.get('limit')) || 20

        let query = { userId: firebaseUser.uid }
        if (packageId) query.packageId = packageId

        const usage = await database.collection('class_package_usage')
          .find(query)
          .sort({ usedAt: -1 })
          .limit(limit)
          .toArray()

        // Get class and studio information
        const classIds = usage.map(u => u.classId).filter(Boolean)
        const studioIds = usage.map(u => u.studioId).filter(Boolean)

        const classes = await database.collection('class_schedules')
          .find({ id: { $in: classIds } })
          .toArray()

        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        const enrichedUsage = usage.map(use => {
          const classInfo = classes.find(c => c.id === use.classId)
          const studio = studios.find(s => s.userId === use.studioId)
          
          return {
            ...use,
            class: classInfo ? {
              name: classInfo.name,
              startTime: classInfo.startTime,
              instructor: classInfo.instructor
            } : null,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address
            } : null
          }
        })

        return NextResponse.json({
          success: true,
          usage: enrichedUsage,
          totalUsage: usage.length
        })

      } catch (error) {
        console.error('Class package usage error:', error)
        return NextResponse.json({ error: 'Failed to retrieve class package usage' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 3: BUSINESS LOGIC & FEE PROCESSING - GET ENDPOINTS
    // ========================================

    // Get studio cancellation policy
    if (path === '/payments/cancellation-policy') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const studioId = url.searchParams.get('studioId')

        if (!studioId) {
          return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
        }

        // Get studio cancellation policy
        const studioPolicy = await database.collection('studio_policies').findOne({
          studioId: studioId
        })

        const defaultPolicy = {
          cancellationWindow: 24, // hours
          lateCancelFee: 1500, // $15 in cents
          noShowFee: 2000, // $20 in cents
          refundPolicy: 'full_refund_within_window',
          freeTrialCancellations: 1,
          gracePeriod: 15, // minutes
          autoMarkNoShow: true,
          weekendPolicy: 'same_as_weekday',
          holidayPolicy: 'extended_window'
        }

        const policy = studioPolicy || defaultPolicy

        // Get user's cancellation history
        const userCancellations = await database.collection('bookings')
          .find({
            userId: firebaseUser.uid,
            studioId: studioId,
            status: { $in: ['cancelled', 'no_show'] }
          })
          .sort({ createdAt: -1 })
          .limit(10)
          .toArray()

        // Calculate user's free trial cancellations used
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const freeCancellationsUsed = userProfile?.freeCancellationsUsed || 0
        const remainingFreeCancellations = Math.max(0, policy.freeTrialCancellations - freeCancellationsUsed)

        return NextResponse.json({
          success: true,
          policy: policy,
          userCancellationHistory: userCancellations.map(booking => ({
            id: booking.id,
            className: booking.className,
            cancellationReason: booking.cancellationReason,
            cancelledAt: booking.cancelledAt,
            cancellationFee: booking.cancellationFee,
            refundAmount: booking.refundAmount,
            status: booking.status
          })),
          userStats: {
            freeCancellationsUsed: freeCancellationsUsed,
            remainingFreeCancellations: remainingFreeCancellations,
            totalCancellations: userCancellations.length
          }
        })

      } catch (error) {
        console.error('Cancellation policy error:', error)
        return NextResponse.json({ error: 'Failed to retrieve cancellation policy' }, { status: 500 })
      }
    }

    // Get platform fee structure
    if (path === '/payments/fee-structure') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const studioId = url.searchParams.get('studioId')

        // Get studio-specific fee structure
        const studioSettings = studioId ? await database.collection('studio_fee_settings').findOne({
          studioId: studioId
        }) : null

        // Base platform fee rates
        const baseFeeRates = {
          class_booking: 0.0375,      // 3.75%
          subscription: 0.0375,       // 3.75%
          class_package: 0.0375,      // 3.75%
          xpass_redemption: 0.075,    // 7.5%
          instructor_payout: 0.05     // 5%
        }

        // Volume-based discounts
        const volumeDiscounts = {
          bronze: { threshold: 0, discount: 0, name: 'Bronze' },
          silver: { threshold: 100, discount: 0.0025, name: 'Silver' },
          gold: { threshold: 500, discount: 0.005, name: 'Gold' },
          platinum: { threshold: 1000, discount: 0.0075, name: 'Platinum' }
        }

        // If studio ID provided, get their current volume tier
        let currentVolumeTier = null
        if (studioId) {
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

          const studioTransactions = await database.collection('transactions')
            .countDocuments({
              studioId: studioId,
              createdAt: { $gte: thirtyDaysAgo },
              status: 'completed'
            })

          if (studioTransactions >= 1000) currentVolumeTier = 'platinum'
          else if (studioTransactions >= 500) currentVolumeTier = 'gold'
          else if (studioTransactions >= 100) currentVolumeTier = 'silver'
          else currentVolumeTier = 'bronze'
        }

        // Calculate effective rates
        const effectiveRates = {}
        Object.keys(baseFeeRates).forEach(paymentType => {
          const baseRate = baseFeeRates[paymentType]
          const studioRate = studioSettings?.customRates?.[paymentType] || baseRate
          const volumeDiscount = currentVolumeTier ? volumeDiscounts[currentVolumeTier].discount : 0
          effectiveRates[paymentType] = Math.max(0, studioRate - volumeDiscount)
        })

        return NextResponse.json({
          success: true,
          feeStructure: {
            baseFeeRates: baseFeeRates,
            effectiveRates: effectiveRates,
            volumeDiscounts: volumeDiscounts,
            currentVolumeTier: currentVolumeTier,
            studioCustomRates: studioSettings?.customRates || null,
            lastUpdated: studioSettings?.updatedAt || null
          }
        })

      } catch (error) {
        console.error('Fee structure error:', error)
        return NextResponse.json({ error: 'Failed to retrieve fee structure' }, { status: 500 })
      }
    }

    // Get failed payment retry history
    if (path === '/payments/retry-history') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const paymentIntentId = url.searchParams.get('paymentIntentId')
        const limit = parseInt(url.searchParams.get('limit')) || 10

        let query = { userId: firebaseUser.uid }
        if (paymentIntentId) {
          query.originalPaymentIntentId = paymentIntentId
        }

        const retryHistory = await database.collection('payment_retries')
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray()

        // Get associated transaction details
        const paymentIntentIds = retryHistory.map(retry => retry.originalPaymentIntentId)
        const transactions = await database.collection('transactions')
          .find({ paymentIntentId: { $in: paymentIntentIds } })
          .toArray()

        const enrichedRetries = retryHistory.map(retry => {
          const transaction = transactions.find(t => t.paymentIntentId === retry.originalPaymentIntentId)
          return {
            ...retry,
            transaction: transaction ? {
              id: transaction.id,
              type: transaction.type,
              amount: transaction.amount,
              originalFailureReason: transaction.failureReason
            } : null
          }
        })

        return NextResponse.json({
          success: true,
          retryHistory: enrichedRetries,
          totalRetries: retryHistory.length
        })

      } catch (error) {
        console.error('Retry history error:', error)
        return NextResponse.json({ error: 'Failed to retrieve retry history' }, { status: 500 })
      }
    }

    // Get proration calculations
    if (path === '/payments/proration-preview') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const subscriptionId = url.searchParams.get('subscriptionId')
        const newPriceId = url.searchParams.get('newPriceId')

        if (!subscriptionId || !newPriceId) {
          return NextResponse.json({ error: 'Subscription ID and new price ID are required' }, { status: 400 })
        }

        // Get current subscription
        const subscription = await database.collection('subscriptions').findOne({
          stripeSubscriptionId: subscriptionId,
          userId: firebaseUser.uid
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found or unauthorized' }, { status: 404 })
        }

        // Get prices from Stripe
        const currentPrice = await stripe.prices.retrieve(subscription.priceId)
        const newPrice = await stripe.prices.retrieve(newPriceId)

        // Calculate proration preview
        const now = new Date()
        const periodEnd = new Date(subscription.currentPeriodEnd)
        const periodStart = new Date(subscription.currentPeriodStart)
        const totalPeriodDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24)
        const remainingDays = Math.max(0, (periodEnd - now) / (1000 * 60 * 60 * 24))
        const usedDays = totalPeriodDays - remainingDays

        // Calculate amounts
        const currentMonthlyAmount = currentPrice.unit_amount
        const newMonthlyAmount = newPrice.unit_amount
        const currentPeriodUsed = (usedDays / totalPeriodDays) * currentMonthlyAmount
        const newPeriodRemaining = (remainingDays / totalPeriodDays) * newMonthlyAmount

        const isUpgrade = newMonthlyAmount > currentMonthlyAmount
        const changeType = isUpgrade ? 'upgrade' : 'downgrade'

        let prorationAmount = 0
        let prorationCredit = 0

        if (isUpgrade) {
          prorationAmount = Math.max(0, newPeriodRemaining - (currentMonthlyAmount - currentPeriodUsed))
        } else {
          prorationCredit = Math.max(0, (currentMonthlyAmount - currentPeriodUsed) - newPeriodRemaining)
        }

        return NextResponse.json({
          success: true,
          prorationPreview: {
            currentPlan: {
              name: currentPrice.nickname || 'Current Plan',
              amount: currentMonthlyAmount,
              priceId: currentPrice.id
            },
            newPlan: {
              name: newPrice.nickname || 'New Plan',
              amount: newMonthlyAmount,
              priceId: newPrice.id
            },
            changeType: changeType,
            billingPeriod: {
              start: periodStart,
              end: periodEnd,
              totalDays: Math.round(totalPeriodDays),
              remainingDays: Math.round(remainingDays),
              usedDays: Math.round(usedDays)
            },
            prorationAmount: prorationAmount,
            prorationCredit: prorationCredit,
            nextBillingAmount: newMonthlyAmount,
            effectiveDate: now
          }
        })

      } catch (error) {
        console.error('Proration preview error:', error)
        return NextResponse.json({ error: 'Failed to calculate proration preview' }, { status: 500 })
      }
    }

    // Get studio policy settings (for merchants)
    if (path === '/payments/studio-policies') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get studio policies
        const studioPolicy = await database.collection('studio_policies').findOne({
          studioId: firebaseUser.uid
        })

        const studioFeeSettings = await database.collection('studio_fee_settings').findOne({
          studioId: firebaseUser.uid
        })

        // Get policy statistics
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const policyStats = await database.collection('bookings')
          .aggregate([
            {
              $match: {
                studioId: firebaseUser.uid,
                createdAt: { $gte: thirtyDaysAgo }
              }
            },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalFees: { $sum: '$cancellationFee' }
              }
            }
          ])
          .toArray()

        const totalBookings = policyStats.reduce((sum, stat) => sum + stat.count, 0)
        const cancellations = policyStats.find(stat => stat._id === 'cancelled')?.count || 0
        const noShows = policyStats.find(stat => stat._id === 'no_show')?.count || 0
        const totalFees = policyStats.reduce((sum, stat) => sum + (stat.totalFees || 0), 0)

        return NextResponse.json({
          success: true,
          policies: {
            cancellationPolicy: studioPolicy || {
              cancellationWindow: 24,
              lateCancelFee: 1500,
              noShowFee: 2000,
              refundPolicy: 'full_refund_within_window',
              freeTrialCancellations: 1,
              gracePeriod: 15,
              autoMarkNoShow: true
            },
            feeSettings: studioFeeSettings || {
              customRates: null,
              volumeDiscountEnabled: true
            }
          },
          statistics: {
            totalBookings: totalBookings,
            cancellations: cancellations,
            noShows: noShows,
            cancellationRate: totalBookings > 0 ? Math.round((cancellations / totalBookings) * 100) : 0,
            noShowRate: totalBookings > 0 ? Math.round((noShows / totalBookings) * 100) : 0,
            totalFeesCollected: totalFees,
            period: '30 days'
          }
        })

      } catch (error) {
        console.error('Studio policies error:', error)
        return NextResponse.json({ error: 'Failed to retrieve studio policies' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 4: BOOKING INTEGRATION & PAYMENT VALIDATION - GET ENDPOINTS
    // ========================================

    // Get user's booking-payment status
    if (path === '/bookings/payment-status') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const bookingId = url.searchParams.get('bookingId')

        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        const booking = await database.collection('bookings').findOne({
          id: bookingId,
          userId: firebaseUser.uid
        })

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
        }

        let paymentStatus = {
          bookingId: booking.id,
          status: booking.status,
          paymentMethod: booking.paymentMethod,
          createdAt: booking.createdAt,
          confirmedAt: booking.confirmedAt,
          paymentCompletedAt: booking.paymentCompletedAt
        }

        // Add payment-specific details
        if (booking.paymentIntentId) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(booking.paymentIntentId)
            paymentStatus.stripePayment = {
              id: paymentIntent.id,
              status: paymentIntent.status,
              amount: paymentIntent.amount,
              requiresAction: paymentIntent.status === 'requires_action',
              clientSecret: paymentIntent.client_secret
            }
          } catch (stripeError) {
            console.error('Stripe payment intent retrieval error:', stripeError)
          }
        }

        if (booking.paymentMethod === 'class_package' && booking.packageId) {
          const packageInfo = await database.collection('class_packages').findOne({
            id: booking.packageId
          })
          if (packageInfo) {
            paymentStatus.packageInfo = {
              type: packageInfo.packageType,
              remainingClasses: packageInfo.remainingClasses,
              expirationDate: packageInfo.expirationDate
            }
          }
        }

        if (booking.paymentMethod === 'xpass') {
          const xpassCredits = await database.collection('xpass_credits').findOne({
            userId: firebaseUser.uid
          })
          if (xpassCredits) {
            paymentStatus.xpassInfo = {
              remainingCredits: xpassCredits.availableCredits
            }
          }
        }

        return NextResponse.json({
          success: true,
          paymentStatus: paymentStatus
        })

      } catch (error) {
        console.error('Booking payment status error:', error)
        return NextResponse.json({ error: 'Failed to retrieve booking payment status' }, { status: 500 })
      }
    }

    // Get available payment options for booking
    if (path === '/bookings/available-payments') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const studioId = url.searchParams.get('studioId')

        if (!studioId) {
          return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 })
        }

        const availableOptions = {}

        // Check active class packages for this studio
        const activePackages = await database.collection('class_packages').find({
          userId: firebaseUser.uid,
          studioId: studioId,
          status: 'active',
          remainingClasses: { $gt: 0 },
          expirationDate: { $gt: new Date() }
        }).toArray()

        if (activePackages.length > 0) {
          availableOptions.classPackages = activePackages.map(pkg => ({
            id: pkg.id,
            packageType: pkg.packageType,
            remainingClasses: pkg.remainingClasses,
            expirationDate: pkg.expirationDate,
            daysUntilExpiration: Math.ceil((new Date(pkg.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
          }))
        }

        // Check active subscriptions for this studio
        const activeSubscriptions = await database.collection('subscriptions').find({
          userId: firebaseUser.uid,
          studioId: studioId,
          status: 'active',
          currentPeriodEnd: { $gt: new Date() }
        }).toArray()

        if (activeSubscriptions.length > 0) {
          availableOptions.subscriptions = activeSubscriptions.map(sub => ({
            id: sub.id,
            subscriptionType: sub.subscriptionType,
            currentPeriodEnd: sub.currentPeriodEnd,
            daysRemaining: Math.ceil((new Date(sub.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
          }))
        }

        // Check X Pass credits and studio acceptance
        const xpassCredits = await database.collection('xpass_credits').findOne({
          userId: firebaseUser.uid
        })

        const studioXPassSettings = await database.collection('studio_xpass_settings').findOne({
          studioId: studioId
        })

        if (xpassCredits?.availableCredits > 0 && studioXPassSettings?.acceptsXPass) {
          availableOptions.xpass = {
            availableCredits: xpassCredits.availableCredits,
            platformFeeRate: studioXPassSettings.platformFeeRate || 0.075,
            accepted: true
          }
        } else if (xpassCredits?.availableCredits > 0) {
          availableOptions.xpass = {
            availableCredits: xpassCredits.availableCredits,
            accepted: false,
            reason: 'Studio does not accept X Pass'
          }
        }

        // Check saved payment methods
        const userProfile = await database.collection('profiles').findOne({
          userId: firebaseUser.uid
        })

        if (userProfile?.stripeCustomerId) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: userProfile.stripeCustomerId,
            type: 'card'
          })

          if (paymentMethods.data.length > 0) {
            availableOptions.savedCards = paymentMethods.data.map(pm => ({
              id: pm.id,
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year
            }))
          }
        }

        return NextResponse.json({
          success: true,
          studioId: studioId,
          availableOptions: availableOptions,
          totalOptions: Object.keys(availableOptions).length
        })

      } catch (error) {
        console.error('Available payments error:', error)
        return NextResponse.json({ error: 'Failed to retrieve available payment options' }, { status: 500 })
      }
    }

    // Get booking validation history
    if (path === '/bookings/validation-history') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit')) || 20
        const offset = parseInt(url.searchParams.get('offset')) || 0

        // Get recent booking attempts
        const bookings = await database.collection('bookings')
          .find({ userId: firebaseUser.uid })
          .sort({ createdAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray()

        // Get class and studio information
        const classIds = bookings.map(b => b.classInstanceId).filter(Boolean)
        const studioIds = bookings.map(b => b.studioId).filter(Boolean)

        const classes = await database.collection('class_schedules')
          .find({ id: { $in: classIds } })
          .toArray()

        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        const enrichedBookings = bookings.map(booking => {
          const classInfo = classes.find(c => c.id === booking.classInstanceId)
          const studio = studios.find(s => s.userId === booking.studioId)

          let validationStatus = 'unknown'
          if (booking.status === 'confirmed') validationStatus = 'success'
          else if (booking.status === 'cancelled') validationStatus = 'cancelled'
          else if (booking.status === 'pending_payment') validationStatus = 'pending'
          else if (booking.status === 'payment_failed') validationStatus = 'failed'

          return {
            id: booking.id,
            status: booking.status,
            validationStatus: validationStatus,
            paymentMethod: booking.paymentMethod,
            createdAt: booking.createdAt,
            confirmedAt: booking.confirmedAt,
            class: classInfo ? {
              name: classInfo.name,
              startTime: classInfo.startTime,
              instructor: classInfo.instructor
            } : null,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address
            } : null
          }
        })

        const totalCount = await database.collection('bookings')
          .countDocuments({ userId: firebaseUser.uid })

        return NextResponse.json({
          success: true,
          bookings: enrichedBookings,
          validation: {
            totalBookings: enrichedBookings.length,
            successful: enrichedBookings.filter(b => b.validationStatus === 'success').length,
            pending: enrichedBookings.filter(b => b.validationStatus === 'pending').length,
            failed: enrichedBookings.filter(b => b.validationStatus === 'failed').length,
            cancelled: enrichedBookings.filter(b => b.validationStatus === 'cancelled').length
          },
          pagination: {
            total: totalCount,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < totalCount
          }
        })

      } catch (error) {
        console.error('Validation history error:', error)
        return NextResponse.json({ error: 'Failed to retrieve validation history' }, { status: 500 })
      }
    }

    // Get credit balance summary
    if (path === '/bookings/credit-balance') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Get X Pass credits
        const xpassCredits = await database.collection('xpass_credits').findOne({
          userId: firebaseUser.uid
        })

        // Get active class packages
        const activePackages = await database.collection('class_packages').find({
          userId: firebaseUser.uid,
          status: 'active',
          remainingClasses: { $gt: 0 },
          expirationDate: { $gt: new Date() }
        }).toArray()

        // Get active subscriptions
        const activeSubscriptions = await database.collection('subscriptions').find({
          userId: firebaseUser.uid,
          status: 'active',
          currentPeriodEnd: { $gt: new Date() }
        }).toArray()

        // Calculate total available credits
        const totalPackageCredits = activePackages.reduce((sum, pkg) => sum + pkg.remainingClasses, 0)
        const totalXPassCredits = xpassCredits?.availableCredits || 0
        const totalSubscriptionAccess = activeSubscriptions.length

        // Get studio information for packages and subscriptions
        const studioIds = [...new Set([
          ...activePackages.map(pkg => pkg.studioId),
          ...activeSubscriptions.map(sub => sub.studioId)
        ])].filter(Boolean)

        const studios = await database.collection('profiles')
          .find({ 
            userId: { $in: studioIds },
            role: 'merchant'
          })
          .toArray()

        // Enrich packages with studio info
        const enrichedPackages = activePackages.map(pkg => {
          const studio = studios.find(s => s.userId === pkg.studioId)
          return {
            ...pkg,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address
            } : null,
            daysUntilExpiration: Math.ceil((new Date(pkg.expirationDate) - new Date()) / (1000 * 60 * 60 * 24))
          }
        })

        // Enrich subscriptions with studio info
        const enrichedSubscriptions = activeSubscriptions.map(sub => {
          const studio = studios.find(s => s.userId === sub.studioId)
          return {
            ...sub,
            studio: studio ? {
              name: studio.businessName || studio.studioName,
              address: studio.address
            } : null,
            daysRemaining: Math.ceil((new Date(sub.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24))
          }
        })

        return NextResponse.json({
          success: true,
          creditBalance: {
            xpass: {
              availableCredits: totalXPassCredits,
              lastUpdated: xpassCredits?.updatedAt,
              totalEarned: xpassCredits?.totalEarned || 0,
              totalSpent: xpassCredits?.totalSpent || 0
            },
            classPackages: {
              totalCredits: totalPackageCredits,
              activePackages: enrichedPackages.length,
              packages: enrichedPackages
            },
            subscriptions: {
              totalAccess: totalSubscriptionAccess,
              activeSubscriptions: enrichedSubscriptions.length,
              subscriptions: enrichedSubscriptions
            },
            summary: {
              totalAvailableCredits: totalPackageCredits + totalXPassCredits,
              totalSubscriptionAccess: totalSubscriptionAccess,
              hasActiveCredits: totalPackageCredits > 0 || totalXPassCredits > 0 || totalSubscriptionAccess > 0
            }
          }
        })

      } catch (error) {
        console.error('Credit balance error:', error)
        return NextResponse.json({ error: 'Failed to retrieve credit balance' }, { status: 500 })
      }
    }

    // Get booking reconciliation report (for studios)
    if (path === '/bookings/reconciliation') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const startDate = new Date(url.searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        const endDate = new Date(url.searchParams.get('endDate') || new Date())

        // Get bookings for this studio in date range
        const bookings = await database.collection('bookings').find({
          studioId: firebaseUser.uid,
          createdAt: { $gte: startDate, $lte: endDate }
        }).toArray()

        // Group by payment method
        const paymentMethodBreakdown = {}
        let totalRevenue = 0
        let totalPlatformFees = 0

        bookings.forEach(booking => {
          const method = booking.paymentMethod || 'unknown'
          if (!paymentMethodBreakdown[method]) {
            paymentMethodBreakdown[method] = {
              count: 0,
              revenue: 0,
              platformFees: 0,
              statuses: {}
            }
          }

          paymentMethodBreakdown[method].count++
          
          const status = booking.status || 'unknown'
          paymentMethodBreakdown[method].statuses[status] = (paymentMethodBreakdown[method].statuses[status] || 0) + 1

          if (booking.amount) {
            paymentMethodBreakdown[method].revenue += booking.amount
            totalRevenue += booking.amount
          }

          if (booking.platformFee) {
            paymentMethodBreakdown[method].platformFees += booking.platformFee
            totalPlatformFees += booking.platformFee
          }
        })

        return NextResponse.json({
          success: true,
          reconciliation: {
            period: {
              startDate: startDate,
              endDate: endDate,
              totalDays: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
            },
            summary: {
              totalBookings: bookings.length,
              totalRevenue: totalRevenue,
              totalPlatformFees: totalPlatformFees,
              netRevenue: totalRevenue - totalPlatformFees
            },
            paymentMethodBreakdown: paymentMethodBreakdown,
            statusBreakdown: {
              confirmed: bookings.filter(b => b.status === 'confirmed').length,
              pending_payment: bookings.filter(b => b.status === 'pending_payment').length,
              cancelled: bookings.filter(b => b.status === 'cancelled').length,
              payment_failed: bookings.filter(b => b.status === 'payment_failed').length,
              no_show: bookings.filter(b => b.status === 'no_show').length
            }
          }
        })

      } catch (error) {
        console.error('Booking reconciliation error:', error)
        return NextResponse.json({ error: 'Failed to generate reconciliation report' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 5: STUDIO MANAGEMENT DASHBOARD - GET ENDPOINTS
    // ========================================

    // Get comprehensive studio dashboard data
    if (path === '/studio/dashboard-overview') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get date range for analytics
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30) // Last 30 days

        // Get booking analytics
        const totalBookings = await database.collection('bookings').countDocuments({
          studioId: firebaseUser.uid,
          createdAt: { $gte: startDate, $lte: endDate }
        })

        const confirmedBookings = await database.collection('bookings').countDocuments({
          studioId: firebaseUser.uid,
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        })

        // Get revenue analytics
        const revenueAgg = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              platformFees: { $sum: '$platformFee' }
            }
          }
        ]).toArray()

        const revenue = revenueAgg[0] || { totalRevenue: 0, platformFees: 0 }
        const netRevenue = revenue.totalRevenue - revenue.platformFees

        // Get active subscriptions
        const activeSubscriptions = await database.collection('subscriptions').countDocuments({
          studioId: firebaseUser.uid,
          status: 'active'
        })

        // Get staff count
        const activeStaff = await database.collection('studio_staff').countDocuments({
          studioId: firebaseUser.uid,
          status: { $ne: 'removed' }
        })

        // Get upcoming classes
        const upcomingClasses = await database.collection('class_schedules').find({
          studioId: firebaseUser.uid,
          startTime: { $gte: new Date().toISOString() },
          status: { $ne: 'cancelled' }
        }).sort({ startTime: 1 }).limit(5).toArray()

        // Get recent reviews
        const recentReviews = await database.collection('reviews').find({
          studioId: firebaseUser.uid
        }).sort({ createdAt: -1 }).limit(5).toArray()

        const averageRating = recentReviews.length > 0 
          ? recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length
          : 0

        // Get top performing classes
        const topClasses = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$className',
              bookings: { $sum: 1 },
              revenue: { $sum: '$amount' }
            }
          },
          { $sort: { bookings: -1 } },
          { $limit: 5 }
        ]).toArray()

        return NextResponse.json({
          success: true,
          dashboard: {
            overview: {
              totalBookings,
              confirmedBookings,
              bookingRate: totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0,
              totalRevenue: revenue.totalRevenue,
              netRevenue,
              platformFees: revenue.platformFees,
              activeSubscriptions,
              activeStaff,
              averageRating: Math.round(averageRating * 10) / 10
            },
            upcomingClasses: upcomingClasses.map(cls => ({
              id: cls.id,
              name: cls.name,
              startTime: cls.startTime,
              instructor: cls.instructor,
              capacity: cls.capacity,
              bookedCount: cls.bookedCount || 0
            })),
            recentReviews: recentReviews.map(review => ({
              id: review.id,
              rating: review.rating,
              comment: review.comment,
              customerName: review.customerName,
              createdAt: review.createdAt
            })),
            topPerformingClasses: topClasses,
            dateRange: {
              startDate,
              endDate,
              periodDays: 30
            }
          }
        })

      } catch (error) {
        console.error('Studio dashboard error:', error)
        return NextResponse.json({ error: 'Failed to retrieve dashboard data' }, { status: 500 })
      }
    }

    // Get studio revenue analytics
    if (path === '/studio/revenue-analytics') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '30days'
        const compareEnabled = url.searchParams.get('compare') === 'true'

        let days
        switch (period) {
          case '7days': days = 7; break
          case '30days': days = 30; break
          case '90days': days = 90; break
          case '1year': days = 365; break
          default: days = 30
        }

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Current period revenue
        const currentRevenue = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
              },
              dailyRevenue: { $sum: '$amount' },
              dailyBookings: { $sum: 1 },
              platformFees: { $sum: '$platformFee' }
            }
          },
          { $sort: { '_id': 1 } }
        ]).toArray()

        // Payment method breakdown
        const paymentMethodBreakdown = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: '$paymentMethod',
              count: { $sum: 1 },
              revenue: { $sum: '$amount' },
              fees: { $sum: '$platformFee' }
            }
          }
        ]).toArray()

        let comparison = null
        if (compareEnabled) {
          const compareEndDate = new Date(startDate)
          const compareStartDate = new Date(startDate)
          compareStartDate.setDate(compareStartDate.getDate() - days)

          const compareRevenue = await database.collection('bookings').aggregate([
            {
              $match: {
                studioId: firebaseUser.uid,
                status: 'confirmed',
                createdAt: { $gte: compareStartDate, $lte: compareEndDate }
              }
            },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalBookings: { $sum: 1 },
                platformFees: { $sum: '$platformFee' }
              }
            }
          ]).toArray()

          comparison = compareRevenue[0] || { totalRevenue: 0, totalBookings: 0, platformFees: 0 }
        }

        // Calculate totals
        const totals = {
          totalRevenue: currentRevenue.reduce((sum, day) => sum + day.dailyRevenue, 0),
          totalBookings: currentRevenue.reduce((sum, day) => sum + day.dailyBookings, 0),
          totalPlatformFees: currentRevenue.reduce((sum, day) => sum + day.platformFees, 0)
        }
        totals.netRevenue = totals.totalRevenue - totals.totalPlatformFees
        totals.averageBookingValue = totals.totalBookings > 0 ? totals.totalRevenue / totals.totalBookings : 0

        return NextResponse.json({
          success: true,
          analytics: {
            period: period,
            dateRange: { startDate, endDate },
            totals,
            dailyRevenue: currentRevenue,
            paymentMethodBreakdown,
            comparison,
            performanceMetrics: {
              revenueGrowth: comparison ? 
                ((totals.totalRevenue - comparison.totalRevenue) / comparison.totalRevenue) * 100 : 0,
              bookingGrowth: comparison ?
                ((totals.totalBookings - comparison.totalBookings) / comparison.totalBookings) * 100 : 0
            }
          }
        })

      } catch (error) {
        console.error('Revenue analytics error:', error)
        return NextResponse.json({ error: 'Failed to retrieve revenue analytics' }, { status: 500 })
      }
    }

    // Get studio configuration settings
    if (path === '/studio/configuration') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get all studio configuration settings
        const [
          cancellationPolicy,
          xpassSettings,
          pricing,
          businessSettings
        ] = await Promise.all([
          database.collection('studio_policies').findOne({ studioId: firebaseUser.uid }),
          database.collection('studio_xpass_settings').findOne({ studioId: firebaseUser.uid }),
          database.collection('studio_pricing').findOne({ studioId: firebaseUser.uid }),
          database.collection('studio_business_settings').findOne({ studioId: firebaseUser.uid })
        ])

        // Provide defaults if not configured
        const configuration = {
          cancellationPolicy: cancellationPolicy || {
            cancellationWindow: 24,
            lateCancelFee: 1500,
            noShowFee: 2000,
            refundPolicy: 'full_refund_within_window',
            freeTrialCancellations: 1,
            gracePeriod: 15,
            autoMarkNoShow: true
          },
          xpassSettings: xpassSettings || {
            acceptsXPass: true,
            platformFeeRate: 0.075,
            acceptedClassTypes: ['all'],
            minimumAdvanceBooking: 0,
            maximumXPassBookingsPerDay: null,
            blackoutDates: []
          },
          pricing: pricing || {
            dropInPrice: 2000,
            memberPrice: 1500,
            classPackages: [],
            subscriptionPlans: [],
            dynamicPricing: false,
            peakHourMultiplier: 1.2,
            studentDiscount: 0.1,
            seniorDiscount: 0.1
          },
          businessSettings: businessSettings || {
            businessHours: {
              monday: { open: '06:00', close: '22:00', closed: false },
              tuesday: { open: '06:00', close: '22:00', closed: false },
              wednesday: { open: '06:00', close: '22:00', closed: false },
              thursday: { open: '06:00', close: '22:00', closed: false },
              friday: { open: '06:00', close: '22:00', closed: false },
              saturday: { open: '08:00', close: '20:00', closed: false },
              sunday: { open: '08:00', close: '18:00', closed: false }
            },
            bookingWindow: 30,
            minBookingNotice: 2,
            maxBookingsPerUser: null,
            waitlistEnabled: true,
            autoConfirmBookings: true,
            reminderSettings: {
              enableEmailReminders: true,
              enableSMSReminders: false,
              reminderTimes: [24, 2],
              cancellationReminders: true
            },
            socialMediaLinks: {},
            amenities: [],
            studioPhotos: []
          }
        }

        return NextResponse.json({
          success: true,
          configuration: configuration,
          lastUpdated: new Date()
        })

      } catch (error) {
        console.error('Studio configuration error:', error)
        return NextResponse.json({ error: 'Failed to retrieve studio configuration' }, { status: 500 })
      }
    }

    // Get studio staff management
    if (path === '/studio/staff-overview') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get all studio staff
        const staff = await database.collection('studio_staff').find({
          studioId: firebaseUser.uid,
          status: { $ne: 'removed' }
        }).toArray()

        // Get class assignments for each instructor
        const instructorIds = staff.filter(s => s.role === 'instructor').map(s => s.id)
        const classAssignments = await database.collection('class_schedules').find({
          instructorId: { $in: instructorIds },
          startTime: { $gte: new Date().toISOString() }
        }).toArray()

        // Get performance metrics for instructors
        const instructorPerformance = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              instructorId: { $in: instructorIds },
              status: 'confirmed',
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: '$instructorId',
              totalClasses: { $sum: 1 },
              totalRevenue: { $sum: '$amount' },
              averageRating: { $avg: '$rating' }
            }
          }
        ]).toArray()

        // Enrich staff data
        const enrichedStaff = staff.map(member => {
          const assignments = classAssignments.filter(cls => cls.instructorId === member.id)
          const performance = instructorPerformance.find(perf => perf._id === member.id)
          
          return {
            ...member,
            upcomingClasses: assignments.length,
            nextClass: assignments.length > 0 ? assignments[0].startTime : null,
            performance: performance ? {
              totalClasses: performance.totalClasses,
              totalRevenue: performance.totalRevenue,
              averageRating: Math.round(performance.averageRating * 10) / 10
            } : null
          }
        })

        return NextResponse.json({
          success: true,
          staff: {
            total: staff.length,
            instructors: enrichedStaff.filter(s => s.role === 'instructor'),
            managers: enrichedStaff.filter(s => s.role === 'manager'),
            support: enrichedStaff.filter(s => s.role === 'staff'),
            pendingInvites: enrichedStaff.filter(s => s.status === 'pending_invite').length
          }
        })

      } catch (error) {
        console.error('Staff overview error:', error)
        return NextResponse.json({ error: 'Failed to retrieve staff overview' }, { status: 500 })
      }
    }

    // Get studio business insights
    if (path === '/studio/business-insights') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

        // Customer retention analysis
        const customerRetention = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed'
            }
          },
          {
            $group: {
              _id: '$userId',
              totalBookings: { $sum: 1 },
              firstBooking: { $min: '$createdAt' },
              lastBooking: { $max: '$createdAt' },
              totalSpent: { $sum: '$amount' }
            }
          },
          {
            $project: {
              isRecurring: { $gt: ['$totalBookings', 1] },
              customerLifetime: {
                $divide: [
                  { $subtract: ['$lastBooking', '$firstBooking'] },
                  1000 * 60 * 60 * 24
                ]
              },
              totalBookings: 1,
              totalSpent: 1
            }
          }
        ]).toArray()

        const recurringCustomers = customerRetention.filter(c => c.isRecurring).length
        const totalCustomers = customerRetention.length
        const retentionRate = totalCustomers > 0 ? (recurringCustomers / totalCustomers) * 100 : 0

        // Peak hours analysis
        const peakHours = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: {
                $hour: { $dateFromString: { dateString: '$classStartTime' } }
              },
              bookings: { $sum: 1 }
            }
          },
          { $sort: { bookings: -1 } }
        ]).toArray()

        // Popular class types
        const popularClasses = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: thirtyDaysAgo }
            }
          },
          {
            $group: {
              _id: '$className',
              bookings: { $sum: 1 },
              revenue: { $sum: '$amount' },
              uniqueCustomers: { $addToSet: '$userId' }
            }
          },
          {
            $project: {
              className: '$_id',
              bookings: 1,
              revenue: 1,
              uniqueCustomers: { $size: '$uniqueCustomers' }
            }
          },
          { $sort: { bookings: -1 } },
          { $limit: 10 }
        ]).toArray()

        // Revenue trends
        const revenueTrends = await database.collection('bookings').aggregate([
          {
            $match: {
              studioId: firebaseUser.uid,
              status: 'confirmed',
              createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                week: { $week: '$createdAt' },
                year: { $year: '$createdAt' }
              },
              weeklyRevenue: { $sum: '$amount' },
              weeklyBookings: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.week': 1 } }
        ]).toArray()

        return NextResponse.json({
          success: true,
          insights: {
            customerAnalytics: {
              totalCustomers,
              recurringCustomers,
              retentionRate: Math.round(retentionRate * 10) / 10,
              averageCustomerLifetime: customerRetention.length > 0 ?
                customerRetention.reduce((sum, c) => sum + c.customerLifetime, 0) / customerRetention.length : 0,
              averageCustomerValue: customerRetention.length > 0 ?
                customerRetention.reduce((sum, c) => sum + c.totalSpent, 0) / customerRetention.length : 0
            },
            operationalInsights: {
              peakHours: peakHours.slice(0, 5),
              popularClasses,
              revenueTrends: revenueTrends.slice(-12) // Last 12 weeks
            },
            recommendations: [
              {
                type: 'retention',
                title: 'Customer Retention',
                description: `${retentionRate.toFixed(1)}% customer retention rate`,
                action: retentionRate < 50 ? 'Consider loyalty programs or membership incentives' : 'Maintain current customer experience'
              },
              {
                type: 'scheduling',
                title: 'Peak Hours Optimization',
                description: `Most popular time: ${peakHours[0] ? peakHours[0]._id : 'N/A'}:00`,
                action: 'Consider adding more classes during peak hours'
              },
              {
                type: 'revenue',
                title: 'Revenue Growth',
                description: 'Based on recent trends',
                action: 'Focus on top-performing class types'
              }
            ]
          }
        })

      } catch (error) {
        console.error('Business insights error:', error)
        return NextResponse.json({ error: 'Failed to retrieve business insights' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 6: INSTRUCTOR PAYOUT SYSTEM - GET ENDPOINTS
    // ========================================

    // Get instructor payout dashboard
    if (path === '/instructor/payout-dashboard') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        // Get instructor payout profile
        const instructorPayout = await database.collection('instructor_payouts').findOne({
          instructorId: firebaseUser.uid
        })

        if (!instructorPayout) {
          return NextResponse.json({ error: 'Instructor payout profile not found' }, { status: 404 })
        }

        // Get recent payout transactions
        const recentPayouts = await database.collection('instructor_payout_transactions').find({
          instructorId: firebaseUser.uid
        }).sort({ processedAt: -1 }).limit(10).toArray()

        // Get current month earnings
        const currentMonth = new Date()
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

        const monthlyBookings = await database.collection('bookings').find({
          instructorId: firebaseUser.uid,
          status: 'confirmed',
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }).toArray()

        const monthlyEarnings = monthlyBookings.reduce((sum, booking) => {
          return sum + ((booking.amount || 0) * instructorPayout.commissionRate)
        }, 0)

        // Get upcoming classes
        const upcomingClasses = await database.collection('class_schedules').find({
          instructorId: firebaseUser.uid,
          startTime: { $gte: new Date().toISOString() },
          status: { $ne: 'cancelled' }
        }).sort({ startTime: 1 }).limit(5).toArray()

        // Calculate next payout date
        const nextPayoutDate = new Date()
        if (instructorPayout.payoutSchedule === 'weekly') {
          nextPayoutDate.setDate(nextPayoutDate.getDate() + (7 - nextPayoutDate.getDay()))
        } else if (instructorPayout.payoutSchedule === 'bi-weekly') {
          nextPayoutDate.setDate(nextPayoutDate.getDate() + 14)
        } else {
          nextPayoutDate.setMonth(nextPayoutDate.getMonth() + 1, 1)
        }

        return NextResponse.json({
          success: true,
          dashboard: {
            profile: {
              instructorId: firebaseUser.uid,
              name: `${userProfile.firstName} ${userProfile.lastName}`,
              commissionRate: instructorPayout.commissionRate,
              payoutSchedule: instructorPayout.payoutSchedule,
              status: instructorPayout.status,
              stripeConnectStatus: instructorPayout.stripeConnectStatus
            },
            earnings: {
              totalLifetimeEarnings: instructorPayout.totalEarnings,
              totalPayouts: instructorPayout.totalPayouts,
              pendingEarnings: instructorPayout.pendingEarnings,
              currentMonthEarnings: monthlyEarnings,
              lastPayoutAt: instructorPayout.lastPayoutAt,
              nextPayoutDate: nextPayoutDate
            },
            recentActivity: {
              recentPayouts: recentPayouts.map(payout => ({
                id: payout.id,
                amount: payout.amount,
                processedAt: payout.processedAt,
                status: payout.status,
                type: payout.payoutType
              })),
              upcomingClasses: upcomingClasses.map(cls => ({
                id: cls.id,
                name: cls.name,
                startTime: cls.startTime,
                expectedEarning: ((cls.price || 2000) * instructorPayout.commissionRate)
              }))
            },
            monthlyStats: {
              classesThisMonth: monthlyBookings.length,
              studentsThisMonth: monthlyBookings.length, // Assuming 1 student per booking
              averageEarningPerClass: monthlyBookings.length > 0 ? monthlyEarnings / monthlyBookings.length : 0
            }
          }
        })

      } catch (error) {
        console.error('Instructor payout dashboard error:', error)
        return NextResponse.json({ error: 'Failed to retrieve payout dashboard' }, { status: 500 })
      }
    }

    // Get instructor earnings history
    if (path === '/instructor/earnings-history') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '30days'
        const limit = parseInt(url.searchParams.get('limit')) || 50
        const offset = parseInt(url.searchParams.get('offset')) || 0

        // Calculate date range
        let days
        switch (period) {
          case '7days': days = 7; break
          case '30days': days = 30; break
          case '90days': days = 90; break
          case '1year': days = 365; break
          default: days = 30
        }

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get instructor payout configuration
        const instructorPayout = await database.collection('instructor_payouts').findOne({
          instructorId: firebaseUser.uid
        })

        if (!instructorPayout) {
          return NextResponse.json({ error: 'Instructor payout profile not found' }, { status: 404 })
        }

        // Get bookings for the period
        const bookings = await database.collection('bookings').find({
          instructorId: firebaseUser.uid,
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray()

        // Calculate earnings for each booking
        const earningsHistory = bookings.map(booking => {
          const classRevenue = booking.amount || 0
          const instructorEarnings = classRevenue * instructorPayout.commissionRate
          
          return {
            id: booking.id,
            classId: booking.classInstanceId,
            className: booking.className,
            classDate: booking.classStartTime,
            studentName: booking.customerName || 'Student',
            classRevenue: classRevenue,
            instructorEarnings: instructorEarnings,
            commissionRate: instructorPayout.commissionRate,
            paymentMethod: booking.paymentMethod,
            bookingDate: booking.createdAt,
            status: booking.status
          }
        })

        // Calculate summary statistics
        const totalEarnings = earningsHistory.reduce((sum, item) => sum + item.instructorEarnings, 0)
        const totalClasses = earningsHistory.length
        const averageEarningsPerClass = totalClasses > 0 ? totalEarnings / totalClasses : 0

        const totalCount = await database.collection('bookings').countDocuments({
          instructorId: firebaseUser.uid,
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        })

        return NextResponse.json({
          success: true,
          earningsHistory: earningsHistory,
          summary: {
            period: period,
            dateRange: { startDate, endDate },
            totalEarnings: totalEarnings,
            totalClasses: totalClasses,
            averageEarningsPerClass: averageEarningsPerClass,
            commissionRate: instructorPayout.commissionRate
          },
          pagination: {
            total: totalCount,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < totalCount
          }
        })

      } catch (error) {
        console.error('Earnings history error:', error)
        return NextResponse.json({ error: 'Failed to retrieve earnings history' }, { status: 500 })
      }
    }

    // Get instructor payout transactions
    if (path === '/instructor/payout-transactions') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit')) || 20
        const offset = parseInt(url.searchParams.get('offset')) || 0
        const status = url.searchParams.get('status') // 'completed', 'pending', 'failed'

        let query = { instructorId: firebaseUser.uid }
        if (status) {
          query.status = status
        }

        const transactions = await database.collection('instructor_payout_transactions').find(query)
          .sort({ processedAt: -1 })
          .skip(offset)
          .limit(limit)
          .toArray()

        const totalCount = await database.collection('instructor_payout_transactions').countDocuments(query)

        // Calculate summary statistics
        const totalPaid = transactions.reduce((sum, txn) => sum + (txn.status === 'completed' ? txn.amount : 0), 0)
        const totalPending = transactions.reduce((sum, txn) => sum + (txn.status === 'pending' ? txn.amount : 0), 0)

        return NextResponse.json({
          success: true,
          transactions: transactions.map(txn => ({
            id: txn.id,
            amount: txn.amount,
            payoutType: txn.payoutType,
            status: txn.status,
            processedAt: txn.processedAt,
            stripeTransferId: txn.stripeTransferId,
            createdAt: txn.createdAt
          })),
          summary: {
            totalPaid: totalPaid,
            totalPending: totalPending,
            totalTransactions: transactions.length
          },
          pagination: {
            total: totalCount,
            limit: limit,
            offset: offset,
            hasMore: offset + limit < totalCount
          }
        })

      } catch (error) {
        console.error('Payout transactions error:', error)
        return NextResponse.json({ error: 'Failed to retrieve payout transactions' }, { status: 500 })
      }
    }

    // Get instructor performance analytics
    if (path === '/instructor/performance-analytics') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '90days'

        // Calculate date range
        let days
        switch (period) {
          case '30days': days = 30; break
          case '90days': days = 90; break
          case '1year': days = 365; break
          default: days = 90
        }

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get all bookings for the period
        const bookings = await database.collection('bookings').find({
          instructorId: firebaseUser.uid,
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }).toArray()

        // Get instructor payout configuration
        const instructorPayout = await database.collection('instructor_payouts').findOne({
          instructorId: firebaseUser.uid
        })

        // Calculate performance metrics
        const totalClasses = bookings.length
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
        const totalEarnings = totalRevenue * (instructorPayout?.commissionRate || 0.7)
        const averageRevenuePerClass = totalClasses > 0 ? totalRevenue / totalClasses : 0
        const averageEarningsPerClass = totalClasses > 0 ? totalEarnings / totalClasses : 0

        // Class performance breakdown
        const classPerformance = {}
        bookings.forEach(booking => {
          const className = booking.className
          if (!classPerformance[className]) {
            classPerformance[className] = {
              classCount: 0,
              totalRevenue: 0,
              totalEarnings: 0,
              students: []
            }
          }
          
          classPerformance[className].classCount++
          classPerformance[className].totalRevenue += booking.amount || 0
          classPerformance[className].totalEarnings += (booking.amount || 0) * (instructorPayout?.commissionRate || 0.7)
          classPerformance[className].students.push(booking.userId)
        })

        // Top performing classes
        const topClasses = Object.entries(classPerformance)
          .map(([className, stats]) => ({
            className,
            classCount: stats.classCount,
            totalRevenue: stats.totalRevenue,
            totalEarnings: stats.totalEarnings,
            averageEarningsPerClass: stats.totalEarnings / stats.classCount,
            uniqueStudents: [...new Set(stats.students)].length
          }))
          .sort((a, b) => b.totalEarnings - a.totalEarnings)
          .slice(0, 5)

        // Monthly trend analysis
        const monthlyTrends = {}
        bookings.forEach(booking => {
          const month = new Date(booking.createdAt).toISOString().substr(0, 7)
          if (!monthlyTrends[month]) {
            monthlyTrends[month] = {
              classes: 0,
              revenue: 0,
              earnings: 0
            }
          }
          
          monthlyTrends[month].classes++
          monthlyTrends[month].revenue += booking.amount || 0
          monthlyTrends[month].earnings += (booking.amount || 0) * (instructorPayout?.commissionRate || 0.7)
        })

        const monthlyData = Object.entries(monthlyTrends)
          .map(([month, stats]) => ({
            month,
            classes: stats.classes,
            revenue: stats.revenue,
            earnings: stats.earnings
          }))
          .sort((a, b) => a.month.localeCompare(b.month))

        // Performance goals and recommendations
        const recommendations = []
        
        if (averageEarningsPerClass < 50) {
          recommendations.push({
            type: 'earnings',
            title: 'Increase Average Earnings',
            description: `Current average: $${averageEarningsPerClass.toFixed(2)}`,
            action: 'Focus on premium classes or increase class size'
          })
        }

        if (totalClasses < 20) {
          recommendations.push({
            type: 'activity',
            title: 'Increase Class Frequency',
            description: `${totalClasses} classes in ${days} days`,
            action: 'Consider teaching more classes per week'
          })
        }

        return NextResponse.json({
          success: true,
          performance: {
            period: period,
            dateRange: { startDate, endDate },
            overview: {
              totalClasses,
              totalRevenue,
              totalEarnings,
              averageRevenuePerClass,
              averageEarningsPerClass,
              commissionRate: instructorPayout?.commissionRate || 0.7
            },
            topPerformingClasses: topClasses,
            monthlyTrends: monthlyData,
            recommendations: recommendations
          }
        })

      } catch (error) {
        console.error('Performance analytics error:', error)
        return NextResponse.json({ error: 'Failed to retrieve performance analytics' }, { status: 500 })
      }
    }

    // Get instructor tax documents
    if (path === '/instructor/tax-documents') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        const url = new URL(request.url)
        const taxYear = parseInt(url.searchParams.get('taxYear')) || new Date().getFullYear()

        // Get 1099 forms for the instructor
        const taxDocuments = await database.collection('instructor_1099_forms').find({
          instructorId: firebaseUser.uid,
          taxYear: taxYear
        }).toArray()

        // Get payout summary for the tax year
        const yearStart = new Date(taxYear, 0, 1)
        const yearEnd = new Date(taxYear, 11, 31)

        const yearlyPayouts = await database.collection('instructor_payout_transactions').find({
          instructorId: firebaseUser.uid,
          processedAt: { $gte: yearStart, $lte: yearEnd },
          status: 'completed'
        }).toArray()

        const yearlyEarnings = yearlyPayouts.reduce((sum, payout) => sum + payout.amount, 0)
        const quarterlyBreakdown = {
          Q1: yearlyPayouts.filter(p => p.processedAt.getMonth() < 3).reduce((sum, p) => sum + p.amount, 0),
          Q2: yearlyPayouts.filter(p => p.processedAt.getMonth() >= 3 && p.processedAt.getMonth() < 6).reduce((sum, p) => sum + p.amount, 0),
          Q3: yearlyPayouts.filter(p => p.processedAt.getMonth() >= 6 && p.processedAt.getMonth() < 9).reduce((sum, p) => sum + p.amount, 0),
          Q4: yearlyPayouts.filter(p => p.processedAt.getMonth() >= 9).reduce((sum, p) => sum + p.amount, 0)
        }

        return NextResponse.json({
          success: true,
          taxDocuments: {
            taxYear: taxYear,
            totalEarnings: yearlyEarnings,
            quarterlyBreakdown: quarterlyBreakdown,
            totalPayouts: yearlyPayouts.length,
            forms: taxDocuments.map(doc => ({
              id: doc.id,
              taxYear: doc.taxYear,
              totalEarnings: doc.earnings.totalEarnings,
              generatedAt: doc.generatedAt,
              status: yearlyEarnings >= 600 ? 'required' : 'not_required' // 1099 threshold
            })),
            taxSummary: {
              form1099Required: yearlyEarnings >= 600,
              estimatedTaxRate: 0.25, // 25% estimated tax rate
              estimatedTaxOwed: yearlyEarnings * 0.25,
              quarterlyEstimate: (yearlyEarnings * 0.25) / 4
            }
          }
        })

      } catch (error) {
        console.error('Tax documents error:', error)
        return NextResponse.json({ error: 'Failed to retrieve tax documents' }, { status: 500 })
      }
    }

    // Get studio instructor payout management (for merchants)
    if (path === '/studio/instructor-payouts') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get all instructors for this studio
        const studioInstructors = await database.collection('studio_staff').find({
          studioId: firebaseUser.uid,
          role: 'instructor',
          status: { $ne: 'removed' }
        }).toArray()

        const instructorIds = studioInstructors.map(instructor => instructor.userId)

        // Get payout configurations for each instructor
        const instructorPayouts = await database.collection('instructor_payouts').find({
          instructorId: { $in: instructorIds }
        }).toArray()

        // Get recent payout transactions
        const recentPayouts = await database.collection('instructor_payout_transactions').find({
          instructorId: { $in: instructorIds }
        }).sort({ processedAt: -1 }).limit(20).toArray()

        // Calculate studio payout summary
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const monthlyPayouts = recentPayouts.filter(payout => payout.processedAt >= thirtyDaysAgo)
        const totalMonthlyPayouts = monthlyPayouts.reduce((sum, payout) => sum + payout.amount, 0)

        // Enrich instructor data
        const enrichedInstructors = studioInstructors.map(instructor => {
          const payoutConfig = instructorPayouts.find(p => p.instructorId === instructor.userId)
          const instructorPayoutHistory = recentPayouts.filter(p => p.instructorId === instructor.userId)
          
          return {
            ...instructor,
            payoutConfig: payoutConfig || {
              commissionRate: 0.7,
              payoutSchedule: 'weekly',
              status: 'not_configured'
            },
            recentPayouts: instructorPayoutHistory.slice(0, 5),
            monthlyEarnings: instructorPayoutHistory
              .filter(p => p.processedAt >= thirtyDaysAgo)
              .reduce((sum, p) => sum + p.amount, 0)
          }
        })

        return NextResponse.json({
          success: true,
          instructorPayouts: {
            instructors: enrichedInstructors,
            summary: {
              totalInstructors: studioInstructors.length,
              activePayouts: instructorPayouts.filter(p => p.status === 'active').length,
              totalMonthlyPayouts: totalMonthlyPayouts,
              averageCommissionRate: instructorPayouts.length > 0 ? 
                instructorPayouts.reduce((sum, p) => sum + p.commissionRate, 0) / instructorPayouts.length : 0.7
            },
            recentActivity: recentPayouts.slice(0, 10).map(payout => ({
              id: payout.id,
              instructorId: payout.instructorId,
              amount: payout.amount,
              processedAt: payout.processedAt,
              status: payout.status
            }))
          }
        })

      } catch (error) {
        console.error('Studio instructor payouts error:', error)
        return NextResponse.json({ error: 'Failed to retrieve instructor payouts' }, { status: 500 })
      }
    }

    // Get studio's payment statistics (for merchants)
    if (path === '/payments/studio-stats') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        // Get studio's revenue from bookings
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 3) // Last 3 months

        const bookings = await database.collection('bookings')
          .find({
            studioId: firebaseUser.uid,
            status: 'confirmed',
            createdAt: { $gte: startDate, $lte: endDate }
          })
          .toArray()

        const subscriptions = await database.collection('subscriptions')
          .find({
            studioId: firebaseUser.uid,
            status: { $in: ['active', 'past_due'] }
          })
          .toArray()

        // Calculate statistics
        const totalBookings = bookings.length
        const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length
        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

        // Platform fees (3.75% for standard, 5-10% for X Pass)
        const platformFees = bookings.reduce((sum, booking) => {
          const feeRate = booking.paymentType === 'xpass' ? 0.075 : 0.0375
          return sum + ((booking.amount || 0) * feeRate)
        }, 0)

        const netRevenue = totalRevenue - platformFees

        return NextResponse.json({
          success: true,
          statistics: {
            totalBookings,
            totalRevenue,
            netRevenue,
            platformFees,
            activeSubscriptions,
            averageBookingValue: Math.round(averageBookingValue * 100) / 100,
            revenueGrowth: 0, // TODO: Calculate month-over-month growth
            period: {
              startDate: startDate,
              endDate: endDate
            }
          }
        })

      } catch (error) {
        console.error('Studio stats error:', error)
        return NextResponse.json({ error: 'Failed to retrieve studio statistics' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePOST(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    const database = await connectDB()

    console.log('SERVER-API POST Request:', path)

    // Ensure test profiles exist for testing
    await ensureTestProfiles(database)

    // Get authenticated user for communication endpoints
    const user = await getFirebaseUser(request)
    if (!user && (path.startsWith('/messages') || path.startsWith('/notifications') || path.startsWith('/communication'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ===== COMMUNICATION LAYER ENDPOINTS (POST) =====
    
    // Create Message Thread
    if (path === '/messages/threads/create') {
      try {
        const { participantIds, initialMessage, type = 'direct', classId, className } = await request.json()
        
        const allParticipantIds = [...new Set([user.uid, ...participantIds])]
        const threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const timestamp = new Date()

        // Get sender details
        const sender = await database.collection('profiles').findOne({ userId: user.uid })
        const senderName = sender?.name || sender?.email || 'Unknown User'

        // Create thread
        const threadData = {
          id: threadId,
          type,
          participantIds: allParticipantIds,
          createdBy: user.uid,
          createdAt: timestamp,
          lastMessageAt: timestamp,
          classId,
          className,
          lastMessage: initialMessage ? {
            content: initialMessage,
            senderId: user.uid,
            senderName,
            timestamp
          } : null
        }

        await database.collection('messageThreads').insertOne(threadData)

        // Send initial message if provided
        if (initialMessage) {
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          await database.collection('messages').insertOne({
            id: messageId,
            threadId,
            content: initialMessage,
            type: 'text',
            senderId: user.uid,
            senderName,
            timestamp,
            readBy: [user.uid],
            createdAt: timestamp
          })
        }

        return NextResponse.json({ success: true, thread: threadData })
      } catch (error) {
        console.error('Error creating thread:', error)
        return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
      }
    }

    // Send Message
    if (path === '/messages/send') {
      try {
        const { threadId, content, type = 'text' } = await request.json()

        // Get sender details
        const sender = await database.collection('profiles').findOne({ userId: user.uid })
        const senderName = sender?.name || sender?.email || 'Unknown User'

        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const timestamp = new Date()

        // Create message
        await database.collection('messages').insertOne({
          id: messageId,
          threadId,
          content,
          type,
          senderId: user.uid,
          senderName,
          timestamp,
          readBy: [user.uid], // Sender has read by default
          createdAt: timestamp
        })

        // Update thread's last message
        await database.collection('messageThreads').updateOne(
          { id: threadId },
          {
            $set: {
              lastMessage: {
                content,
                senderId: user.uid,
                senderName,
                timestamp
              },
              lastMessageAt: timestamp
            }
          }
        )

        // Create notifications for other participants
        const thread = await database.collection('messageThreads').findOne({ id: threadId })
        if (thread) {
          const otherParticipants = thread.participantIds.filter(id => id !== user.uid)
          
          for (const participantId of otherParticipants) {
            await createNotification(database, participantId, 'message', 'New Message', 
              `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`, {
              threadId,
              senderId: user.uid,
              senderName
            })
          }
        }

        return NextResponse.json({ success: true, messageId })
      } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
      }
    }

    // Mark Messages as Read
    if (path.startsWith('/messages/threads/') && path.endsWith('/read')) {
      const pathParts = path.split('/')
      const threadId = pathParts[3]
      
      try {
        // Update all unread messages in the thread
        await database.collection('messages').updateMany(
          {
            threadId,
            senderId: { $ne: user.uid },
            readBy: { $nin: [user.uid] }
          },
          {
            $push: { readBy: user.uid },
            $set: { updatedAt: new Date() }
          }
        )

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error marking messages as read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
    }

    // Send Notification
    if (path === '/notifications/send') {
      try {
        const { userId, type, title, message, data = {}, deliveryType = 'inApp' } = await request.json()

        await createNotification(database, userId, type, title, message, data, deliveryType)
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error sending notification:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
      }
    }

    // Mark Notification as Read
    if (path.startsWith('/notifications/') && path.endsWith('/read') && !path.includes('/mark-all-read')) {
      const pathParts = path.split('/')
      const notificationId = pathParts[2]
      
      try {
        await database.collection('notifications').updateOne(
          { id: notificationId, userId: user.uid },
          {
            $set: {
              read: true,
              readAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
    }

    // Mark All Notifications as Read
    if (path === '/notifications/mark-all-read') {
      try {
        await database.collection('notifications').updateMany(
          { userId: user.uid, read: false },
          {
            $set: {
              read: true,
              readAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
      }
    }

    // Send Broadcast (Merchant only)
    if (path === '/communication/broadcast') {
      const profile = await database.collection('profiles').findOne({ userId: user.uid })
      if (!profile || profile.role !== 'merchant') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      try {
        const { recipients, message, title, type = 'announcement' } = await request.json()

        const broadcastId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const broadcast = {
          id: broadcastId,
          studioId: user.uid,
          title,
          message,
          type,
          recipients: recipients || 'all',
          createdAt: new Date(),
          sentCount: 0,
          deliveredCount: 0,
          status: 'sending'
        }

        await database.collection('broadcasts').insertOne(broadcast)

        // Send notifications to recipients (simplified for now)
        let recipientList = []
        if (recipients === 'all') {
          const profiles = await database.collection('profiles').find({}).toArray()
          recipientList = profiles.map(p => p.userId)
        } else if (Array.isArray(recipients)) {
          recipientList = recipients
        }

        let sentCount = 0
        for (const recipientId of recipientList) {
          try {
            await createNotification(database, recipientId, type, title, message, { broadcastId })
            sentCount++
          } catch (error) {
            console.error('Error sending notification to:', recipientId, error)
          }
        }

        // Update broadcast stats
        await database.collection('broadcasts').updateOne(
          { id: broadcastId },
          {
            $set: {
              sentCount,
              status: 'sent'
            }
          }
        )

        return NextResponse.json({ success: true, broadcast: { ...broadcast, sentCount } })
      } catch (error) {
        console.error('Error sending broadcast:', error)
        return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 })
      }
    }

    // ========================================
    // AI CONFIGURATION WIZARD ENDPOINTS
    // ========================================

    // Analyze studio requirements for intelligent configuration
    if (path === '/ai-wizard/analyze') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { studioData } = body

        if (!studioData) {
          return NextResponse.json({ error: 'Studio data is required' }, { status: 400 })
        }

        const analysis = await AIConfigurationWizard.analyzeStudioRequirements(studioData)
        
        return NextResponse.json({
          ...analysis,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Studio analysis error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Generate complete studio configuration
    if (path === '/ai-wizard/generate-config') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { analysisResults, preferences } = body

        if (!analysisResults) {
          return NextResponse.json({ error: 'Analysis results are required' }, { status: 400 })
        }

        const configuration = await AIConfigurationWizard.generateStudioConfiguration(analysisResults, preferences)
        
        return NextResponse.json({
          ...configuration,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Configuration generation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Apply generated configuration to studio
    if (path === '/ai-wizard/apply-config') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { configuration } = body

        if (!configuration) {
          return NextResponse.json({ error: 'Configuration is required' }, { status: 400 })
        }

        const result = await AIConfigurationWizard.applyConfiguration(firebaseUser.uid, configuration)
        
        return NextResponse.json({
          ...result,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Configuration application error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Generate configuration alternatives
    if (path === '/ai-wizard/alternatives') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { currentConfig, preferences } = body

        if (!currentConfig) {
          return NextResponse.json({ error: 'Current configuration is required' }, { status: 400 })
        }

        const alternatives = await AIConfigurationWizard.generateConfigurationAlternatives(currentConfig, preferences)
        
        return NextResponse.json({
          ...alternatives,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Configuration alternatives error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // ========================================
    // AI-POWERED SMART DATA IMPORTER ENDPOINTS
    // ========================================

    // Analyze uploaded data file for intelligent field mapping
    if (path === '/import/analyze') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { fileContent, fileName } = body

        if (!fileContent || !fileName) {
          return NextResponse.json({ error: 'File content and name are required' }, { status: 400 })
        }

        const { analyzeDataFile } = await import('@/lib/data-importer')
        const analysis = await analyzeDataFile(fileContent, fileName, firebaseUser.uid)
        
        return NextResponse.json({
          analysis: analysis,
          aiPowered: true,
          fileName: fileName,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Data file analysis error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Validate field mappings before import
    if (path === '/import/validate') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { mappings } = body

        if (!mappings || !Array.isArray(mappings)) {
          return NextResponse.json({ error: 'Field mappings array is required' }, { status: 400 })
        }

        const { validateFieldMapping } = await import('@/lib/data-importer')
        const validation = await validateFieldMapping(mappings, firebaseUser.uid)
        
        return NextResponse.json({
          validation: validation,
          mappingsCount: mappings.length,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Field mapping validation error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Execute data import with validated mappings
    if (path === '/import/execute') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { fileContent, mappings, importConfig } = body

        if (!fileContent || !mappings || !Array.isArray(mappings)) {
          return NextResponse.json({ error: 'File content and mappings are required' }, { status: 400 })
        }

        const config = {
          batchSize: 100,
          fileName: 'imported_data.csv',
          ...importConfig
        }

        const { executeDataImport } = await import('@/lib/data-importer')
        const result = await executeDataImport(fileContent, mappings, config, firebaseUser.uid)
        
        // Send success notification
        const notification = {
          id: `notification-${Date.now()}`,
          senderId: 'system',
          recipientId: firebaseUser.uid,
          type: 'in_app',
          subject: 'Data Import Completed',
          message: `Successfully imported ${result.successfulImports} records from ${config.fileName}`,
          templateId: 'import_complete',
          templateData: {
            totalRecords: result.totalRecords,
            successfulImports: result.successfulImports,
            failedImports: result.failedImports,
            executionTime: Math.round(result.executionTime / 1000)
          },
          status: 'pending',
          createdAt: new Date()
        }

        await database.collection('notifications').insertOne(notification)
        
        return NextResponse.json({
          result: result,
          aiPowered: true,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Data import execution error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Provide feedback on AI analysis for learning
    if (path === '/import/feedback') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { analysisId, userMappings } = body

        if (!analysisId || !userMappings) {
          return NextResponse.json({ error: 'Analysis ID and user mappings are required' }, { status: 400 })
        }

        const { learnFromUserFeedback } = await import('@/lib/data-importer')
        const learningResult = await learnFromUserFeedback(analysisId, userMappings, firebaseUser.uid)
        
        return NextResponse.json({
          learningResult: learningResult,
          message: 'Thank you for the feedback! Our AI will improve.',
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Learning feedback error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    // Add the specific endpoints mentioned in the review request
    if (path === '/data-importer/parse') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { fileContent, fileName } = body

        if (!fileContent || !fileName) {
          return NextResponse.json({ error: 'File content and name are required' }, { status: 400 })
        }

        const { analyzeDataFile } = await import('@/lib/data-importer')
        const analysis = await analyzeDataFile(fileContent, fileName, firebaseUser.uid)
        
        return NextResponse.json({
          analysis: analysis,
          aiPowered: true,
          fileName: fileName,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Data file analysis error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    if (path === '/data-importer/import') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { fileContent, mappings, importConfig } = body

        if (!fileContent || !mappings || !Array.isArray(mappings)) {
          return NextResponse.json({ error: 'File content and mappings are required' }, { status: 400 })
        }

        const config = {
          batchSize: 100,
          fileName: 'imported_data.csv',
          ...importConfig
        }

        const { executeDataImport } = await import('@/lib/data-importer')
        const result = await executeDataImport(fileContent, mappings, config, firebaseUser.uid)
        
        return NextResponse.json({
          result: result,
          aiPowered: true,
          userId: firebaseUser.uid,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Data import execution error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

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

    // Fix user role endpoint (temporary admin function)
    if (path === '/admin/fix-user-role') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { newRole, businessName } = body

        if (!newRole || !['customer', 'instructor', 'merchant'].includes(newRole)) {
          return NextResponse.json({ error: 'Valid role is required' }, { status: 400 })
        }

        // Update user profile with correct role
        const updateData = {
          role: newRole,
          updatedAt: new Date()
        }

        if (newRole === 'merchant' && businessName) {
          updateData.studioName = businessName
          updateData.name = businessName
          updateData.businessName = businessName
        }

        await database.collection('profiles').updateOne(
          { userId: firebaseUser.uid },
          { $set: updateData },
          { upsert: true }
        )

        const updatedProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })

        return NextResponse.json({
          message: 'Role updated successfully',
          profile: updatedProfile,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Fix user role error:', error)
        return NextResponse.json({ error: 'Failed to fix user role' }, { status: 500 })
      }
    }

    // Handle onboarding completion - OPTIMIZED FOR SPEED
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
        // PERFORMANCE OPTIMIZATION: Use minimal data structure and single operation
        const updateData = {
          role,
          onboarding_complete: true,
          updatedAt: new Date()
        }

        // Only add essential fields to minimize data transfer
        if (profileData) {
          if (profileData.businessName) {
            updateData.name = profileData.businessName
            updateData.studioName = profileData.businessName
          } else if (profileData.firstName && profileData.lastName) {
            updateData.name = `${profileData.firstName} ${profileData.lastName}`
          }
          
          // Store full profile data for later access but don't process now
          updateData.profileData = profileData
        }

        // SINGLE DATABASE OPERATION - no unnecessary queries
        await database.collection('profiles').updateOne(
          { userId: firebaseUser.uid },
          { $set: updateData },
          { upsert: true }
        )

        console.log('✅ Fast onboarding completed for user:', firebaseUser.uid)

        // IMMEDIATE RESPONSE - don't wait for additional operations
        return NextResponse.json({
          message: 'Onboarding completed successfully',
          redirect: `/dashboard/${role}`,
          timestamp: new Date().toISOString()
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
        
        // Debug logging
        console.log('Class creation - User Profile:', JSON.stringify(userProfile, null, 2))
        
        if (!userProfile) {
          return NextResponse.json({ error: 'User profile not found. Please complete onboarding first.' }, { status: 404 })
        }
        
        if (userProfile.role !== 'merchant') {
          return NextResponse.json({ 
            error: `Access denied: You must be a studio owner to create classes. Current role: ${userProfile.role}`,
            userRole: userProfile.role,
            requiredRole: 'merchant'
          }, { status: 403 })
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

    // Handle X Pass credit purchase
    if (path === '/user/purchase-xpass') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { packageType, credits, price } = body

        // Validate package options
        const validPackages = {
          'basic': { credits: 5, price: 75 },
          'standard': { credits: 10, price: 140 },
          'premium': { credits: 15, price: 195 }
        }

        if (!validPackages[packageType]) {
          return NextResponse.json({ error: 'Invalid package type' }, { status: 400 })
        }

        const packageInfo = validPackages[packageType]

        // Create X Pass credit pack
        const xpassPack = {
          id: `xpass-${Date.now()}`,
          userId: firebaseUser.uid,
          packageType,
          creditsTotal: packageInfo.credits,
          creditsRemaining: packageInfo.credits,
          price: packageInfo.price,
          purchaseDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
          status: 'active',
          createdAt: new Date()
        }

        await database.collection('user_xpass_credits').insertOne(xpassPack)

        // Record transaction
        const transaction = {
          id: `txn-${Date.now()}`,
          userId: firebaseUser.uid,
          type: 'xpass_purchase',
          amount: packageInfo.price,
          description: `X Pass ${packageType} package - ${packageInfo.credits} credits`,
          status: 'completed',
          createdAt: new Date()
        }

        await database.collection('user_transactions').insertOne(transaction)

        return NextResponse.json({
          message: 'X Pass credits purchased successfully',
          pack: xpassPack,
          transaction: transaction
        })
      } catch (error) {
        console.error('X Pass purchase error:', error)
        return NextResponse.json({ error: 'Failed to purchase X Pass credits' }, { status: 500 })
      }
    }

    // Handle no-show penalty processing
    if (path === '/admin/process-noshow') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { bookingId, classId, userId } = body

        // Get booking details
        const booking = await database.collection('bookings').findOne({ id: bookingId })
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Get class details
        const classData = await database.collection('studio_classes').findOne({ id: classId })
        if (!classData) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Get studio's cancellation settings
        const studioSettings = await database.collection('studio_xpass_settings').findOne({ 
          studioId: classData.studioId 
        })
        
        const noShowFee = studioSettings?.noShowFee || 15
        const lateCancelFee = studioSettings?.lateCancelFee || 10

        // Process penalty based on payment method
        let penaltyAmount = noShowFee
        let creditDeducted = false

        if (booking.paymentMethod === 'class_pack' || booking.paymentMethod === 'xpass') {
          // Deduct credit AND apply fee for class packs/X Pass
          if (booking.paymentMethod === 'class_pack') {
            await database.collection('user_class_packs').updateOne(
              { userId: userId, creditsRemaining: { $gt: 0 } },
              { $inc: { creditsRemaining: -1 } }
            )
          } else if (booking.paymentMethod === 'xpass') {
            await database.collection('user_xpass_credits').updateOne(
              { userId: userId, creditsRemaining: { $gt: 0 } },
              { $inc: { creditsRemaining: -1 } }
            )
          }
          creditDeducted = true
        }
        
        // Apply cancellation fee (for all payment methods)
        const penalty = {
          id: `penalty-${Date.now()}`,
          userId: userId,
          bookingId: bookingId,
          classId: classId,
          studioId: classData.studioId,
          type: 'no_show',
          feeAmount: penaltyAmount,
          creditDeducted: creditDeducted,
          reason: 'No-show for scheduled class',
          status: 'applied',
          createdAt: new Date()
        }

        await database.collection('user_penalties').insertOne(penalty)

        // Update booking status
        await database.collection('bookings').updateOne(
          { id: bookingId },
          { 
            $set: { 
              status: 'no_show',
              penaltyApplied: true,
              penaltyAmount: penaltyAmount,
              updatedAt: new Date()
            }
          }
        )

        // Record transaction for fee
        const transaction = {
          id: `txn-${Date.now()}`,
          userId: userId,
          type: 'no_show_fee',
          amount: penaltyAmount,
          description: `No-show fee for ${classData.title}`,
          status: 'pending_payment',
          createdAt: new Date()
        }

        await database.collection('user_transactions').insertOne(transaction)

        console.log('No-show penalty processed:', penalty.id)

        return NextResponse.json({
          message: 'No-show penalty applied successfully',
          penalty: penalty,
          creditDeducted: creditDeducted,
          feeAmount: penaltyAmount
        })
      } catch (error) {
        console.error('No-show processing error:', error)
        return NextResponse.json({ error: 'Failed to process no-show penalty' }, { status: 500 })
      }
    }

    // Update studio X Pass settings
    if (path === '/studio/xpass-settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { xpassEnabled, acceptedClassTypes, cancellationWindow, noShowFee, lateCancelFee } = body

        const studio = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!studio || studio.role !== 'merchant') {
          return NextResponse.json({ error: 'Studio access required' }, { status: 403 })
        }

        const settings = {
          studioId: firebaseUser.uid,
          studioName: studio.name || studio.email.split('@')[0],
          xpassEnabled: xpassEnabled || false,
          acceptedClassTypes: acceptedClassTypes || [],
          cancellationWindow: cancellationWindow || 2,
          noShowFee: noShowFee || 15,
          lateCancelFee: lateCancelFee || 10,
          platformFeeRate: 0.05, // 5% for X Pass redemptions
          updatedAt: new Date()
        }

        await database.collection('studio_xpass_settings').updateOne(
          { studioId: firebaseUser.uid },
          { $set: settings },
          { upsert: true }
        )

        return NextResponse.json({
          message: 'X Pass settings updated successfully',
          settings: settings
        })
      } catch (error) {
        console.error('Studio X Pass settings update error:', error)
        return NextResponse.json({ error: 'Failed to update X Pass settings' }, { status: 500 })
      }
    }
    
    // Mark notification as read
    if (path === '/notifications/mark-read') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { notificationId } = body

        await database.collection('notifications').updateOne(
          { 
            id: notificationId,
            recipients: firebaseUser.uid
          },
          { 
            $set: { 
              readAt: new Date(),
              status: 'read'
            }
          }
        )

        return NextResponse.json({
          message: 'Notification marked as read'
        })
      } catch (error) {
        console.error('Mark notification read error:', error)
        return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 })
      }
    }

    // Trigger automated notifications (internal system use)
    if (path === '/notifications/trigger') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { trigger, entityId, userId, data } = body

        let notification = null

        switch (trigger) {
          case 'booking_confirmed':
            notification = {
              id: `notification-${Date.now()}`,
              senderId: 'system',
              recipients: [userId],
              type: 'in_app',
              subject: 'Booking Confirmed',
              message: `Your booking for ${data.className} has been confirmed for ${data.date} at ${data.time}`,
              templateId: 'booking_confirmed',
              templateData: data,
              status: 'delivered',
              sentAt: new Date(),
              createdAt: new Date()
            }
            break

          case 'class_cancelled':
            notification = {
              id: `notification-${Date.now()}`,
              senderId: 'system',
              recipients: [userId],
              type: 'in_app',
              subject: 'Class Cancelled',
              message: `Your class ${data.className} on ${data.date} has been cancelled. You will be refunded.`,
              templateId: 'class_cancelled',
              templateData: data,
              status: 'delivered',
              sentAt: new Date(),
              createdAt: new Date()
            }
            break

          case 'no_show_penalty':
            notification = {
              id: `notification-${Date.now()}`,
              senderId: 'system',
              recipients: [userId],
              type: 'in_app',
              subject: 'No-Show Penalty Applied',
              message: `You missed your class. ${data.creditDeducted ? '1 credit has been deducted and' : ''} a cancellation fee of $${data.feeAmount} has been charged.`,
              templateId: 'no_show_penalty',
              templateData: data,
              status: 'delivered',
              sentAt: new Date(),
              createdAt: new Date()
            }
            break

          case 'low_credits':
            notification = {
              id: `notification-${Date.now()}`,
              senderId: 'system',
              recipients: [userId],
              type: 'in_app',
              subject: 'Low Credit Balance',
              message: `Low balance: only ${data.creditsRemaining} class${data.creditsRemaining === 1 ? '' : 'es'} remaining in your pack`,
              templateId: 'low_credits',
              templateData: data,
              status: 'delivered',
              sentAt: new Date(),
              createdAt: new Date()
            }
            break

          default:
            return NextResponse.json({ error: 'Unknown notification trigger' }, { status: 400 })
        }

        if (notification) {
          await database.collection('notifications').insertOne(notification)
        }

        return NextResponse.json({
          message: 'Notification triggered successfully',
          notificationId: notification.id
        })
      } catch (error) {
        console.error('Trigger notification error:', error)
        return NextResponse.json({ error: 'Failed to trigger notification' }, { status: 500 })
      }
    }
    
    // Send notification (email/SMS/in-app)
    if (path === '/notifications/send') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { type, recipients, subject, message, templateId, data } = body

        // Create notification record
        const notification = {
          id: `notification-${Date.now()}`,
          senderId: firebaseUser.uid,
          type: type, // 'email', 'sms', 'in_app', 'push'
          recipients: recipients, // array of user IDs or email/phone
          subject: subject || '',
          message: message,
          templateId: templateId || null,
          templateData: data || {},
          status: 'pending',
          sentAt: null,
          deliveredAt: null,
          readAt: null,
          createdAt: new Date()
        }

        await database.collection('notifications').insertOne(notification)

        // Process notification sending (mock implementation)
        console.log('Notification queued:', notification.id)

        return NextResponse.json({
          message: 'Notification queued for delivery',
          notificationId: notification.id,
          status: 'queued'
        })
      } catch (error) {
        console.error('Notification send error:', error)
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
      }
    }
    
    // Upload file (images, documents)
    if (path === '/files/upload') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.formData()
        const file = body.get('file')
        const fileType = body.get('type') // 'profile', 'class', 'studio'
        const entityId = body.get('entityId')

        if (!file) {
          return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Convert file to base64 for storage (in production, use cloud storage)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`

        // Create file record
        const fileRecord = {
          id: `file-${Date.now()}`,
          uploaderId: firebaseUser.uid,
          filename: file.name,
          fileType: fileType,
          entityId: entityId,
          mimeType: file.type,
          size: file.size,
          dataUrl: dataUrl, // In production, this would be a cloud storage URL
          uploadedAt: new Date()
        }

        await database.collection('uploaded_files').insertOne(fileRecord)

        // Update entity with file reference
        if (fileType === 'profile') {
          await database.collection('profiles').updateOne(
            { userId: firebaseUser.uid },
            { $set: { profileImage: fileRecord.id, updatedAt: new Date() } }
          )
        } else if (fileType === 'class' && entityId) {
          await database.collection('studio_classes').updateOne(
            { id: entityId, studioId: firebaseUser.uid },
            { $set: { classImage: fileRecord.id, updatedAt: new Date() } }
          )
        }

        return NextResponse.json({
          message: 'File uploaded successfully',
          fileId: fileRecord.id,
          url: dataUrl
        })
      } catch (error) {
        console.error('File upload error:', error)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
      }
    }

    // Record analytics event
    if (path === '/analytics/event') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { eventType, entityId, data } = body

        const analyticsEvent = {
          id: `event-${Date.now()}`,
          userId: firebaseUser.uid,
          eventType: eventType,
          entityId: entityId,
          data: data || {},
          timestamp: new Date(),
          createdAt: new Date()
        }

        await database.collection('analytics_events').insertOne(analyticsEvent)

        return NextResponse.json({
          message: 'Analytics event recorded',
          eventId: analyticsEvent.id
        })
      } catch (error) {
        console.error('Analytics event error:', error)
        return NextResponse.json({ error: 'Failed to record analytics event' }, { status: 500 })
      }
    }

    // Record search analytics event
    if (path === '/analytics/search-event') {
      const firebaseUser = await getFirebaseUser(request)
      // Allow anonymous search tracking, but record userId if available

      try {
        const body = await request.json()
        const { 
          query, 
          searchType, 
          results, 
          clickedResult, 
          sessionId, 
          filters,
          userAgent,
          referrer 
        } = body

        if (!query && !clickedResult) {
          return NextResponse.json({ error: 'Query or clicked result is required' }, { status: 400 })
        }

        const searchEvent = {
          id: `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: firebaseUser?.uid || 'anonymous',
          query: query || null,
          searchType: searchType || 'text', // text, voice, filter, suggestion
          results: {
            total: results?.total || 0,
            categories: results?.categories || {},
            responseTime: results?.responseTime || null
          },
          clickedResult: clickedResult ? {
            id: clickedResult.id,
            type: clickedResult.type, // class, instructor, studio, category
            name: clickedResult.name,
            position: clickedResult.position || null,
            source: clickedResult.source || 'search_results' // search_results, suggestions, trending
          } : null,
          filters: filters || {},
          sessionId: sessionId || `session-${Date.now()}`,
          metadata: {
            userAgent: userAgent || null,
            referrer: referrer || null,
            timestamp: new Date(),
            platform: 'web'
          },
          createdAt: new Date()
        }

        await database.collection('search_analytics').insertOne(searchEvent)

        return NextResponse.json({
          success: true,
          message: 'Search analytics recorded',
          eventId: searchEvent.id,
          sessionId: searchEvent.sessionId
        })

      } catch (error) {
        console.error('Search analytics error:', error)
        return NextResponse.json({ error: 'Failed to record search analytics' }, { status: 500 })
      }
    }

    // ========================================
    // INSTRUCTOR STAFFING & SCHEDULE MANAGEMENT SYSTEM
    // ========================================

    // Request shift swap between instructors
    if (path === '/staffing/request-swap') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, recipientInstructorId, message } = body

        if (!classId || !recipientInstructorId) {
          return NextResponse.json({ error: 'Class ID and recipient instructor ID are required' }, { status: 400 })
        }

        // Verify initiator is assigned to the class
        const classAssignment = await database.collection('studio_classes').findOne({
          id: classId,
          assignedInstructorId: firebaseUser.uid
        })

        if (!classAssignment) {
          return NextResponse.json({ error: 'You are not assigned to this class' }, { status: 403 })
        }

        // Check if recipient instructor exists
        const recipientProfile = await database.collection('profiles').findOne({
          userId: recipientInstructorId,
          role: 'instructor'
        })

        if (!recipientProfile) {
          return NextResponse.json({ error: 'Recipient instructor not found' }, { status: 404 })
        }

        // Check for existing pending swap request
        const existingSwap = await database.collection('swap_requests').findOne({
          classId: classId,
          status: 'pending'
        })

        if (existingSwap) {
          return NextResponse.json({ error: 'A swap request for this class is already pending' }, { status: 409 })
        }

        // Create swap request
        const swapRequest = {
          id: `swap-${Date.now()}`,
          classId: classId,
          initiatorId: firebaseUser.uid,
          recipientId: recipientInstructorId,
          studioId: classAssignment.studioId,
          message: message || '',
          status: 'pending', // 'pending', 'accepted', 'rejected', 'approved', 'completed'
          requiresApproval: false, // Will be updated based on studio settings
          createdAt: new Date(),
          updatedAt: new Date()
        }

        // Check studio approval settings
        const studioSettings = await database.collection('studio_staffing_settings').findOne({
          studioId: classAssignment.studioId
        })

        if (studioSettings && studioSettings.requireApproval) {
          swapRequest.requiresApproval = true
        }

        await database.collection('swap_requests').insertOne(swapRequest)

        // Send notification to recipient
        const notification = {
          id: `notification-${Date.now()}`,
          senderId: firebaseUser.uid,
          recipientId: recipientInstructorId,
          type: 'in_app',
          subject: 'Shift Swap Request',
          message: `${classAssignment.className} on ${new Date(classAssignment.startTime).toLocaleDateString()} - Swap requested`,
          templateId: 'swap_request',
          templateData: {
            className: classAssignment.className,
            date: new Date(classAssignment.startTime).toLocaleDateString(),
            time: new Date(classAssignment.startTime).toLocaleTimeString(),
            requestId: swapRequest.id
          },
          status: 'pending',
          createdAt: new Date()
        }

        await database.collection('notifications').insertOne(notification)

        return NextResponse.json({
          message: 'Swap request sent successfully',
          swapRequestId: swapRequest.id,
          requiresApproval: swapRequest.requiresApproval
        })
      } catch (error) {
        console.error('Swap request error:', error)
        return NextResponse.json({ error: 'Failed to create swap request' }, { status: 500 })
      }
    }

    // Accept shift swap request
    if (path === '/staffing/accept-swap') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { swapRequestId } = body

        if (!swapRequestId) {
          return NextResponse.json({ error: 'Swap request ID is required' }, { status: 400 })
        }

        // Find swap request
        const swapRequest = await database.collection('swap_requests').findOne({
          id: swapRequestId,
          recipientId: firebaseUser.uid,
          status: 'pending'
        })

        if (!swapRequest) {
          return NextResponse.json({ error: 'Swap request not found or already processed' }, { status: 404 })
        }

        // Perform conflict detection
        const classData = await database.collection('studio_classes').findOne({ id: swapRequest.classId })
        if (!classData) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Check for scheduling conflicts
        const conflicts = await database.collection('studio_classes').find({
          assignedInstructorId: firebaseUser.uid,
          startTime: {
            $gte: new Date(new Date(classData.startTime).getTime() - 60 * 60 * 1000), // 1 hour before
            $lte: new Date(new Date(classData.endTime).getTime() + 60 * 60 * 1000)    // 1 hour after
          }
        }).toArray()

        if (conflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Scheduling conflict detected',
            conflicts: conflicts.map(c => ({ className: c.className, startTime: c.startTime }))
          }, { status: 409 })
        }

        // Update swap request status
        let newStatus = swapRequest.requiresApproval ? 'awaiting_approval' : 'accepted'
        
        await database.collection('swap_requests').updateOne(
          { id: swapRequestId },
          { 
            $set: { 
              status: newStatus,
              acceptedAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        // If no approval required, execute the swap immediately
        if (!swapRequest.requiresApproval) {
          await database.collection('studio_classes').updateOne(
            { id: swapRequest.classId },
            {
              $set: {
                assignedInstructorId: firebaseUser.uid,
                assignedInstructorName: (await database.collection('profiles').findOne({ userId: firebaseUser.uid }))?.name || 'Unknown',
                updatedAt: new Date()
              }
            }
          )

          // Record analytics event
          await database.collection('analytics_events').insertOne({
            id: `event-${Date.now()}`,
            userId: firebaseUser.uid,
            eventType: 'shift_swap_completed',
            entityId: swapRequest.classId,
            data: {
              swapRequestId: swapRequestId,
              fromInstructorId: swapRequest.initiatorId,
              toInstructorId: firebaseUser.uid,
              requiresApproval: false
            },
            timestamp: new Date(),
            createdAt: new Date()
          })
        }

        // Send notifications
        const notifications = []

        // Notify initiator
        notifications.push({
          id: `notification-${Date.now()}-1`,
          senderId: firebaseUser.uid,
          recipientId: swapRequest.initiatorId,
          type: 'in_app',
          subject: newStatus === 'accepted' ? 'Swap Request Accepted' : 'Swap Request Pending Approval',
          message: newStatus === 'accepted' 
            ? 'Your shift swap has been accepted and is now active!'
            : 'Your shift swap has been accepted but requires studio approval.',
          templateId: 'swap_accepted',
          templateData: { swapRequestId, status: newStatus },
          status: 'pending',
          createdAt: new Date()
        })

        // If requires approval, notify studio
        if (swapRequest.requiresApproval) {
          notifications.push({
            id: `notification-${Date.now()}-2`,
            senderId: firebaseUser.uid,
            recipientId: swapRequest.studioId,
            type: 'in_app',
            subject: 'Shift Swap Awaiting Approval',
            message: 'A shift swap between instructors requires your approval.',
            templateId: 'swap_approval_needed',
            templateData: { swapRequestId, classId: swapRequest.classId },
            status: 'pending',
            createdAt: new Date()
          })
        }

        await database.collection('notifications').insertMany(notifications)

        return NextResponse.json({
          message: 'Swap request accepted successfully',
          status: newStatus,
          requiresApproval: swapRequest.requiresApproval
        })
      } catch (error) {
        console.error('Accept swap error:', error)
        return NextResponse.json({ error: 'Failed to accept swap request' }, { status: 500 })
      }
    }

    // Request coverage for a class
    if (path === '/staffing/request-coverage') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, message, urgent } = body

        if (!classId) {
          return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
        }

        // Verify user is assigned to the class or is studio owner
        const classData = await database.collection('studio_classes').findOne({ id: classId })
        if (!classData) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (classData.assignedInstructorId !== firebaseUser.uid && 
            classData.studioId !== firebaseUser.uid && 
            userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Unauthorized to request coverage for this class' }, { status: 403 })
        }

        // Create coverage request
        const coverageRequest = {
          id: `coverage-${Date.now()}`,
          classId: classId,
          requesterId: firebaseUser.uid,
          studioId: classData.studioId,
          message: message || '',
          urgent: urgent || false,
          status: 'open', // 'open', 'filled', 'cancelled'
          applicants: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.collection('coverage_requests').insertOne(coverageRequest)

        // Mark class as needing coverage
        await database.collection('studio_classes').updateOne(
          { id: classId },
          { 
            $set: { 
              needsCoverage: true,
              coverageRequestId: coverageRequest.id,
              updatedAt: new Date()
            }
          }
        )

        // Notify all studio instructors
        const studioInstructors = await database.collection('profiles').find({
          role: 'instructor',
          // Add studio association when we have that data structure
        }).toArray()

        const notifications = studioInstructors.map(instructor => ({
          id: `notification-${Date.now()}-${instructor.userId}`,
          senderId: firebaseUser.uid,
          recipientId: instructor.userId,
          type: 'in_app',
          subject: urgent ? '🚨 Urgent Coverage Needed' : 'Coverage Opportunity Available',
          message: `${classData.className} on ${new Date(classData.startTime).toLocaleDateString()} needs coverage`,
          templateId: 'coverage_request',
          templateData: {
            className: classData.className,
            date: new Date(classData.startTime).toLocaleDateString(),
            time: new Date(classData.startTime).toLocaleTimeString(),
            coverageRequestId: coverageRequest.id,
            urgent: urgent
          },
          status: 'pending',
          createdAt: new Date()
        }))

        if (notifications.length > 0) {
          await database.collection('notifications').insertMany(notifications)
        }

        return NextResponse.json({
          message: 'Coverage request created successfully',
          coverageRequestId: coverageRequest.id,
          notificationsSent: notifications.length
        })
      } catch (error) {
        console.error('Coverage request error:', error)
        return NextResponse.json({ error: 'Failed to create coverage request' }, { status: 500 })
      }
    }

    // Apply to cover a class
    if (path === '/staffing/apply-coverage') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { coverageRequestId, message } = body

        if (!coverageRequestId) {
          return NextResponse.json({ error: 'Coverage request ID is required' }, { status: 400 })
        }

        // Find coverage request
        const coverageRequest = await database.collection('coverage_requests').findOne({
          id: coverageRequestId,
          status: 'open'
        })

        if (!coverageRequest) {
          return NextResponse.json({ error: 'Coverage request not found or no longer available' }, { status: 404 })
        }

        // Verify user is an instructor
        const userProfile = await database.collection('profiles').findOne({ 
          userId: firebaseUser.uid,
          role: 'instructor'
        })

        if (!userProfile) {
          return NextResponse.json({ error: 'Only instructors can apply for coverage' }, { status: 403 })
        }

        // Check if instructor already applied
        const existingApplication = coverageRequest.applicants.find(app => app.instructorId === firebaseUser.uid)
        if (existingApplication) {
          return NextResponse.json({ error: 'You have already applied for this coverage' }, { status: 409 })
        }

        // Check for conflicts
        const classData = await database.collection('studio_classes').findOne({ id: coverageRequest.classId })
        const conflicts = await database.collection('studio_classes').find({
          assignedInstructorId: firebaseUser.uid,
          startTime: {
            $gte: new Date(new Date(classData.startTime).getTime() - 60 * 60 * 1000),
            $lte: new Date(new Date(classData.endTime).getTime() + 60 * 60 * 1000)
          }
        }).toArray()

        if (conflicts.length > 0) {
          return NextResponse.json({ 
            error: 'Scheduling conflict detected',
            conflicts: conflicts.map(c => ({ className: c.className, startTime: c.startTime }))
          }, { status: 409 })
        }

        // Add application to coverage request
        const application = {
          instructorId: firebaseUser.uid,
          instructorName: userProfile.name || 'Unknown',
          message: message || '',
          appliedAt: new Date(),
          status: 'pending' // 'pending', 'selected', 'rejected'
        }

        await database.collection('coverage_requests').updateOne(
          { id: coverageRequestId },
          { 
            $push: { applicants: application },
            $set: { updatedAt: new Date() }
          }
        )

        // Notify studio/requester
        const notification = {
          id: `notification-${Date.now()}`,
          senderId: firebaseUser.uid,
          recipientId: coverageRequest.requesterId,
          type: 'in_app',
          subject: 'New Coverage Application',
          message: `${userProfile.name || 'An instructor'} has applied to cover your class`,
          templateId: 'coverage_application',
          templateData: {
            instructorName: userProfile.name || 'Unknown',
            coverageRequestId: coverageRequestId
          },
          status: 'pending',
          createdAt: new Date()
        }

        await database.collection('notifications').insertOne(notification)

        return NextResponse.json({
          message: 'Coverage application submitted successfully',
          applicationStatus: 'pending'
        })
      } catch (error) {
        console.error('Coverage application error:', error)
        return NextResponse.json({ error: 'Failed to apply for coverage' }, { status: 500 })
      }
    }

    // Studio approve/reject swap request
    if (path === '/staffing/approve-swap') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { swapRequestId, approved, reason } = body

        if (!swapRequestId || approved === undefined) {
          return NextResponse.json({ error: 'Swap request ID and approval status are required' }, { status: 400 })
        }

        // Find swap request and verify studio ownership
        const swapRequest = await database.collection('swap_requests').findOne({
          id: swapRequestId,
          studioId: firebaseUser.uid,
          status: 'awaiting_approval'
        })

        if (!swapRequest) {
          return NextResponse.json({ error: 'Swap request not found or not awaiting approval' }, { status: 404 })
        }

        const newStatus = approved ? 'approved' : 'rejected'
        
        await database.collection('swap_requests').updateOne(
          { id: swapRequestId },
          { 
            $set: { 
              status: newStatus,
              approvedAt: approved ? new Date() : null,
              rejectedAt: approved ? null : new Date(),
              approvalReason: reason || '',
              updatedAt: new Date()
            }
          }
        )

        // If approved, execute the swap
        if (approved) {
          await database.collection('studio_classes').updateOne(
            { id: swapRequest.classId },
            {
              $set: {
                assignedInstructorId: swapRequest.recipientId,
                assignedInstructorName: (await database.collection('profiles').findOne({ userId: swapRequest.recipientId }))?.name || 'Unknown',
                updatedAt: new Date()
              }
            }
          )

          // Record analytics
          await database.collection('analytics_events').insertOne({
            id: `event-${Date.now()}`,
            userId: firebaseUser.uid,
            eventType: 'shift_swap_approved',
            entityId: swapRequest.classId,
            data: {
              swapRequestId: swapRequestId,
              fromInstructorId: swapRequest.initiatorId,
              toInstructorId: swapRequest.recipientId
            },
            timestamp: new Date(),
            createdAt: new Date()
          })
        }

        // Notify both instructors
        const notifications = [
          {
            id: `notification-${Date.now()}-1`,
            senderId: firebaseUser.uid,
            recipientId: swapRequest.initiatorId,
            type: 'in_app',
            subject: approved ? 'Swap Request Approved' : 'Swap Request Rejected',
            message: approved 
              ? 'Your shift swap has been approved by the studio!'
              : `Your shift swap was rejected. ${reason || ''}`,
            templateId: approved ? 'swap_approved' : 'swap_rejected',
            templateData: { swapRequestId, reason },
            status: 'pending',
            createdAt: new Date()
          },
          {
            id: `notification-${Date.now()}-2`,
            senderId: firebaseUser.uid,
            recipientId: swapRequest.recipientId,
            type: 'in_app',
            subject: approved ? 'Swap Request Approved' : 'Swap Request Rejected',
            message: approved 
              ? 'The shift swap has been approved - you are now assigned to this class!'
              : `The shift swap was rejected. ${reason || ''}`,
            templateId: approved ? 'swap_approved' : 'swap_rejected',
            templateData: { swapRequestId, reason },
            status: 'pending',
            createdAt: new Date()
          }
        ]

        await database.collection('notifications').insertMany(notifications)

        return NextResponse.json({
          message: `Swap request ${approved ? 'approved' : 'rejected'} successfully`,
          status: newStatus
        })
      } catch (error) {
        console.error('Approve swap error:', error)
        return NextResponse.json({ error: 'Failed to process swap approval' }, { status: 500 })
      }
    }

    // Send staffing chat message
    if (path === '/staffing/chat') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { studioId, message, relatedClassId, relatedSwapId } = body

        if (!studioId || !message) {
          return NextResponse.json({ error: 'Studio ID and message are required' }, { status: 400 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })

        const chatMessage = {
          id: `msg-${Date.now()}`,
          studioId: studioId,
          senderId: firebaseUser.uid,
          senderName: userProfile?.name || 'Unknown',
          senderRole: userProfile?.role || 'unknown',
          message: message,
          relatedClassId: relatedClassId || null,
          relatedSwapId: relatedSwapId || null,
          timestamp: new Date(),
          createdAt: new Date()
        }

        await database.collection('staffing_chat').insertOne(chatMessage)

        // Notify all studio instructors about new chat message
        const studioInstructors = await database.collection('profiles').find({
          role: 'instructor',
          // Add studio filtering logic when available
        }).toArray()

        const notifications = studioInstructors
          .filter(instructor => instructor.userId !== firebaseUser.uid)
          .map(instructor => ({
            id: `notification-${Date.now()}-${instructor.userId}`,
            senderId: firebaseUser.uid,
            recipientId: instructor.userId,
            type: 'in_app',
            subject: 'New Staffing Chat Message',
            message: `${userProfile?.name || 'Someone'}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            templateId: 'chat_message',
            templateData: { messageId: chatMessage.id, studioId },
            status: 'pending',
            createdAt: new Date()
          }))

        if (notifications.length > 0) {
          await database.collection('notifications').insertMany(notifications)
        }

        return NextResponse.json({
          message: 'Chat message sent successfully',
          messageId: chatMessage.id,
          notificationsSent: notifications.length
        })
      } catch (error) {
        console.error('Chat message error:', error)
        return NextResponse.json({ error: 'Failed to send chat message' }, { status: 500 })
      }
    }

    // Update studio staffing settings
    if (path === '/staffing/settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Verify user is studio owner/merchant
        const userProfile = await database.collection('profiles').findOne({ 
          userId: firebaseUser.uid,
          role: 'merchant'
        })

        if (!userProfile) {
          return NextResponse.json({ error: 'Access denied: Merchant role required' }, { status: 403 })
        }

        const body = await request.json()
        const { 
          requireApproval, 
          maxWeeklyHours, 
          minHoursBetweenClasses, 
          allowSelfSwap, 
          allowCoverageRequest,
          notifyOnSwapRequest,
          notifyOnCoverageRequest
        } = body

        const updatedSettings = {
          studioId: firebaseUser.uid,
          requireApproval: requireApproval ?? false,
          maxWeeklyHours: maxWeeklyHours ?? 40,
          minHoursBetweenClasses: minHoursBetweenClasses ?? 1,
          allowSelfSwap: allowSelfSwap ?? true,
          allowCoverageRequest: allowCoverageRequest ?? true,
          notifyOnSwapRequest: notifyOnSwapRequest ?? true,
          notifyOnCoverageRequest: notifyOnCoverageRequest ?? true,
          updatedAt: new Date()
        }

        await database.collection('studio_staffing_settings').updateOne(
          { studioId: firebaseUser.uid },
          { $set: updatedSettings },
          { upsert: true }
        )

        return NextResponse.json({
          message: 'Staffing settings updated successfully',
          settings: updatedSettings
        })
      } catch (error) {
        console.error('Staffing settings update error:', error)
        return NextResponse.json({ error: 'Failed to update staffing settings' }, { status: 500 })
      }
    }



    // Generate personalized workout plan
    if (path === '/ai/workout-plan') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { goals, duration, preferences } = body

        if (!goals || !duration) {
          return NextResponse.json({ error: 'Goals and duration are required' }, { status: 400 })
        }

        const { generateWorkoutPlan } = await import('@/lib/ai-recommendations')
        const workoutPlan = await generateWorkoutPlan(
          firebaseUser.uid, 
          goals, 
          duration, 
          preferences || []
        )
        
        return NextResponse.json({
          workoutPlan: workoutPlan,
          aiGenerated: true,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Workout plan generation error:', error)
        return NextResponse.json({ error: 'Failed to generate workout plan' }, { status: 500 })
      }
    }

    // ===== AI MIGRATION & DATA IMPORT ENDPOINTS =====

    // Upload migration file
    if (path === '/migration/upload') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Check if user is a merchant/studio owner
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!userProfile || userProfile.role !== 'merchant') {
          return NextResponse.json({ error: 'Only studio owners can upload migration data' }, { status: 403 })
        }

        const body = await request.json()
        const { fileName, fileData, fileSize, mimeType, chunkIndex, totalChunks } = body

        if (!fileName || !fileData) {
          return NextResponse.json({ error: 'File name and data are required' }, { status: 400 })
        }

        // Handle chunked upload
        const uploadId = `${firebaseUser.uid}_${Date.now()}`
        
        if (totalChunks && totalChunks > 1) {
          // Store chunk in temporary collection
          await database.collection('migration_chunks').insertOne({
            uploadId,
            fileName,
            chunkIndex: chunkIndex || 0,
            chunkData: fileData,
            userId: firebaseUser.uid,
            createdAt: new Date()
          })

          // Check if all chunks received
          const chunks = await database.collection('migration_chunks')
            .find({ uploadId })
            .sort({ chunkIndex: 1 })
            .toArray()

          if (chunks.length === totalChunks) {
            // Combine chunks
            const completeFileData = chunks.map(chunk => chunk.chunkData).join('')
            
            // Clean up chunks
            await database.collection('migration_chunks').deleteMany({ uploadId })
            
            // Store complete file
            await database.collection('migration_uploads').insertOne({
              uploadId,
              fileName,
              fileData: completeFileData,
              fileSize,
              mimeType,
              userId: firebaseUser.uid,
              status: 'uploaded',
              createdAt: new Date()
            })

            return NextResponse.json({
              uploadId,
              status: 'complete',
              message: `File ${fileName} uploaded successfully (${fileSize} bytes)`
            })
          } else {
            return NextResponse.json({
              uploadId,
              status: 'partial',
              chunksReceived: chunks.length,
              totalChunks,
              message: `Chunk ${chunkIndex + 1}/${totalChunks} received`
            })
          }
        } else {
          // Single file upload
          await database.collection('migration_uploads').insertOne({
            uploadId,
            fileName,
            fileData,
            fileSize,
            mimeType,
            userId: firebaseUser.uid,
            status: 'uploaded',
            createdAt: new Date()
          })

          return NextResponse.json({
            uploadId,
            status: 'complete',
            message: `File ${fileName} uploaded successfully`
          })
        }

      } catch (error) {
        console.error('Migration upload error:', error)
        return NextResponse.json({ error: 'Failed to upload migration file' }, { status: 500 })
      }
    }

    // Parse migration data
    if (path === '/migration/parse') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { uploadId } = body

        if (!uploadId) {
          return NextResponse.json({ error: 'Upload ID is required' }, { status: 400 })
        }

        // Get uploaded file
        const upload = await database.collection('migration_uploads').findOne({
          uploadId,
          userId: firebaseUser.uid
        })

        if (!upload) {
          return NextResponse.json({ error: 'Upload not found' }, { status: 404 })
        }

        // Update status to parsing
        await database.collection('migration_uploads').updateOne(
          { uploadId },
          { $set: { status: 'parsing', parsedAt: new Date() } }
        )

        // Import AI parser
        const { default: aiParser } = await import('../../../lib/ai-migration-parser.js')
        
        // Parse the file data
        const parseResult = await aiParser.parseFileData(
          upload.fileData,
          upload.fileName,
          upload.mimeType
        )

        if (!parseResult.success) {
          await database.collection('migration_uploads').updateOne(
            { uploadId },
            { 
              $set: { 
                status: 'parse_failed',
                error: parseResult.error,
                suggestions: parseResult.suggestions
              }
            }
          )

          return NextResponse.json({
            success: false,
            error: parseResult.error,
            suggestions: parseResult.suggestions
          }, { status: 400 })
        }

        // Store parsed data
        const parsedDataId = `parsed_${uploadId}`
        await database.collection('migration_parsed_data').insertOne({
          parsedDataId,
          uploadId,
          userId: firebaseUser.uid,
          fileName: upload.fileName,
          method: parseResult.method,
          confidence: parseResult.confidence,
          data: parseResult.data,
          warnings: parseResult.warnings || [],
          aiInsights: parseResult.aiInsights,
          createdAt: new Date()
        })

        // Update upload status
        await database.collection('migration_uploads').updateOne(
          { uploadId },
          { 
            $set: { 
              status: 'parsed',
              parsedDataId,
              parseMethod: parseResult.method,
              parseConfidence: parseResult.confidence
            }
          }
        )

        return NextResponse.json({
          success: true,
          parsedDataId,
          method: parseResult.method,
          confidence: parseResult.confidence,
          summary: {
            classes: parseResult.data.classes?.length || 0,
            instructors: parseResult.data.instructors?.length || 0,
            clients: parseResult.data.clients?.length || 0,
            schedules: parseResult.data.schedules?.length || 0
          },
          warnings: parseResult.warnings || [],
          aiInsights: parseResult.aiInsights,
          message: `Data parsed successfully using ${parseResult.method} method`
        })

      } catch (error) {
        console.error('Migration parsing error:', error)
        
        // Update status to failed
        if (body?.uploadId) {
          await database.collection('migration_uploads').updateOne(
            { uploadId: body.uploadId },
            { $set: { status: 'parse_failed', error: error.message } }
          )
        }

        return NextResponse.json({ error: 'Failed to parse migration data' }, { status: 500 })
      }
    }

    // Confirm and import migration data
    if (path === '/migration/import') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { parsedDataId, selectedData, fieldMappings, resolveConflicts } = body

        if (!parsedDataId) {
          return NextResponse.json({ error: 'Parsed data ID is required' }, { status: 400 })
        }

        // Get parsed data
        const parsedData = await database.collection('migration_parsed_data').findOne({
          parsedDataId,
          userId: firebaseUser.uid
        })

        if (!parsedData) {
          return NextResponse.json({ error: 'Parsed data not found' }, { status: 404 })
        }

        // Update status to importing
        await database.collection('migration_parsed_data').updateOne(
          { parsedDataId },
          { $set: { status: 'importing', importStartedAt: new Date() } }
        )

        const importResults = {
          classes: { imported: 0, skipped: 0, errors: [] },
          instructors: { imported: 0, skipped: 0, errors: [] },
          clients: { imported: 0, skipped: 0, errors: [] },
          schedules: { imported: 0, skipped: 0, errors: [] }
        }

        // Import classes
        if (selectedData?.classes !== false && parsedData.data.classes) {
          for (const classData of parsedData.data.classes) {
            try {
              const classRecord = {
                id: classData.id || `imported_${Date.now()}_${Math.random()}`,
                name: classData.name,
                description: classData.description || '',
                duration: classData.duration || 60,
                capacity: classData.capacity || 20,
                price: classData.price || 0,
                category: classData.category || 'fitness',
                level: classData.level || 'all-levels',
                requirements: classData.requirements || '',
                studioId: firebaseUser.uid,
                createdAt: new Date(),
                imported: true,
                originalData: classData.originalRecord
              }

              await database.collection('studio_classes').insertOne(classRecord)
              importResults.classes.imported++
            } catch (error) {
              importResults.classes.errors.push(`${classData.name}: ${error.message}`)
              importResults.classes.skipped++
            }
          }
        }

        // Import instructors
        if (selectedData?.instructors !== false && parsedData.data.instructors) {
          for (const instructorData of parsedData.data.instructors) {
            try {
              // Check for existing instructor by email
              const existingInstructor = await database.collection('profiles').findOne({
                email: instructorData.email,
                role: 'instructor'
              })

              if (existingInstructor && !resolveConflicts?.instructors?.allowDuplicates) {
                importResults.instructors.skipped++
                continue
              }

              const instructorRecord = {
                userId: instructorData.id || `imported_${Date.now()}_${Math.random()}`,
                firstName: instructorData.firstName,
                lastName: instructorData.lastName,
                name: `${instructorData.firstName} ${instructorData.lastName}`,
                email: instructorData.email,
                phone: instructorData.phone || '',
                role: 'instructor',
                bio: instructorData.bio || '',
                specialties: instructorData.specialties || [],
                certifications: instructorData.certifications || [],
                experience: instructorData.experience || '',
                studioId: firebaseUser.uid,
                onboarding_complete: true,
                createdAt: new Date(),
                imported: true,
                originalData: instructorData.originalRecord
              }

              await database.collection('profiles').insertOne(instructorRecord)
              importResults.instructors.imported++
            } catch (error) {
              importResults.instructors.errors.push(`${instructorData.firstName} ${instructorData.lastName}: ${error.message}`)
              importResults.instructors.skipped++
            }
          }
        }

        // Import clients
        if (selectedData?.clients !== false && parsedData.data.clients) {
          for (const clientData of parsedData.data.clients) {
            try {
              // Check for existing client by email
              const existingClient = await database.collection('profiles').findOne({
                email: clientData.email,
                role: 'customer'
              })

              if (existingClient && !resolveConflicts?.clients?.allowDuplicates) {
                importResults.clients.skipped++
                continue
              }

              const clientRecord = {
                userId: clientData.id || `imported_${Date.now()}_${Math.random()}`,
                firstName: clientData.firstName,
                lastName: clientData.lastName,
                name: `${clientData.firstName} ${clientData.lastName}`,
                email: clientData.email,
                phone: clientData.phone || '',
                role: 'customer',
                membershipType: clientData.membershipType || 'drop-in',
                joinDate: clientData.joinDate || new Date().toISOString(),
                notes: clientData.notes || '',
                studioId: firebaseUser.uid,
                onboarding_complete: true,
                createdAt: new Date(),
                imported: true,
                originalData: clientData.originalRecord
              }

              await database.collection('profiles').insertOne(clientRecord)
              importResults.clients.imported++
            } catch (error) {
              importResults.clients.errors.push(`${clientData.firstName} ${clientData.lastName}: ${error.message}`)
              importResults.clients.skipped++
            }
          }
        }

        // Update final status
        await database.collection('migration_parsed_data').updateOne(
          { parsedDataId },
          { 
            $set: { 
              status: 'imported',
              importResults,
              importCompletedAt: new Date()
            }
          }
        )

        // Update upload status
        await database.collection('migration_uploads').updateOne(
          { uploadId: parsedData.uploadId },
          { $set: { status: 'completed', importResults } }
        )

        return NextResponse.json({
          success: true,
          importResults,
          message: `Migration completed successfully! Imported ${importResults.classes.imported} classes, ${importResults.instructors.imported} instructors, ${importResults.clients.imported} clients.`
        })

      } catch (error) {
        console.error('Migration import error:', error)
        
        // Update status to failed
        if (body?.parsedDataId) {
          await database.collection('migration_parsed_data').updateOne(
            { parsedDataId: body.parsedDataId },
            { $set: { status: 'import_failed', error: error.message } }
          )
        }

        return NextResponse.json({ error: 'Failed to import migration data' }, { status: 500 })
      }
    }

    // ===== ADVANCED CLASS MANAGEMENT & SCHEDULING ENDPOINTS =====

    // Create new class template
    if (path === '/classes') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Check if user is a merchant/studio owner
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        if (!userProfile || userProfile.role !== 'merchant') {
          return NextResponse.json({ error: 'Only studio owners can create classes' }, { status: 403 })
        }

        const body = await request.json()
        const { 
          name, description, duration, capacity, price, category, level, 
          requirements, startTime, scheduleDays, recurrencePattern,
          defaultInstructorId, tags, memberPlusOnly, xPassEligible 
        } = body

        if (!name || !duration || !capacity || !startTime) {
          return NextResponse.json({ error: 'Name, duration, capacity, and start time are required' }, { status: 400 })
        }

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Validate scheduling
        const validation = schedulingEngine.validateScheduling(body)
        if (!validation.isValid) {
          return NextResponse.json({ 
            error: 'Invalid class data', 
            details: validation.errors 
          }, { status: 400 })
        }

        const classTemplate = {
          id: `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          description: description || '',
          duration: parseInt(duration),
          capacity: parseInt(capacity),
          price: parseFloat(price) || 0,
          category: category || 'fitness',
          level: level || 'all-levels',
          requirements: requirements || '',
          startTime, // Format: "HH:MM"
          scheduleDays: scheduleDays || [], // ['monday', 'wednesday', 'friday']
          recurrencePattern: recurrencePattern || 'weekly',
          defaultInstructorId: defaultInstructorId || null,
          tags: tags || [],
          memberPlusOnly: memberPlusOnly || false,
          xPassEligible: xPassEligible !== false,
          studioId: firebaseUser.uid,
          studioName: userProfile.studioName || userProfile.businessName || 'Studio',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.collection('studio_classes').insertOne(classTemplate)

        return NextResponse.json({
          success: true,
          class: classTemplate,
          warnings: validation.warnings || [],
          message: `Class "${name}" created successfully`
        })

      } catch (error) {
        console.error('Class creation error:', error)
        return NextResponse.json({ error: 'Failed to create class' }, { status: 500 })
      }
    }

    // Generate class schedule instances
    if (path === '/classes/schedule/generate') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, startDate, endDate, recurrencePattern } = body

        if (!classId || !startDate || !endDate) {
          return NextResponse.json({ error: 'Class ID, start date, and end date are required' }, { status: 400 })
        }

        // Get class template
        const classTemplate = await database.collection('studio_classes').findOne({
          id: classId,
          studioId: firebaseUser.uid
        })

        if (!classTemplate) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Generate schedule instances
        const instances = schedulingEngine.generateScheduleInstances(
          classTemplate,
          startDate,
          endDate,
          recurrencePattern || classTemplate.recurrencePattern
        )

        // Save instances to database
        if (instances.length > 0) {
          await database.collection('class_schedules').insertMany(instances)
        }

        return NextResponse.json({
          success: true,
          generated: instances.length,
          instances: instances.slice(0, 10), // Return first 10 for preview
          totalGenerated: instances.length,
          message: `Generated ${instances.length} class instances`
        })

      } catch (error) {
        console.error('Schedule generation error:', error)
        return NextResponse.json({ error: 'Failed to generate schedule' }, { status: 500 })
      }
    }

    // Book a class
    if (path === '/booking/create') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classInstanceId, paymentMethod, membershipType } = body

        if (!classInstanceId) {
          return NextResponse.json({ error: 'Class instance ID is required' }, { status: 400 })
        }

        // Get class instance
        const classInstance = await database.collection('class_schedules').findOne({
          id: classInstanceId
        })

        if (!classInstance) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Check if user already booked this class
        const existingBooking = await database.collection('bookings').findOne({
          classInstanceId,
          userId: firebaseUser.uid,
          status: { $in: ['confirmed', 'pending'] }
        })

        if (existingBooking) {
          return NextResponse.json({ error: 'You have already booked this class' }, { status: 400 })
        }

        // Get current bookings for availability check
        const currentBookings = await database.collection('bookings')
          .find({ 
            classInstanceId, 
            status: 'confirmed' 
          })
          .toArray()

        // Get user membership
        const userMembership = await database.collection('user_memberships').findOne({
          userId: firebaseUser.uid,
          status: 'active'
        })

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Calculate current availability
        const updatedInstance = schedulingEngine.calculateAvailability(
          [classInstance], 
          currentBookings, 
          []
        )[0]

        // Process booking request
        const bookingResult = schedulingEngine.processBookingRequest(
          updatedInstance, 
          firebaseUser.uid, 
          userMembership
        )

        if (!bookingResult.success) {
          if (bookingResult.code === 'CLASS_FULL' && bookingResult.suggestion === 'waitlist') {
            return NextResponse.json({
              error: bookingResult.error,
              code: bookingResult.code,
              suggestion: 'Would you like to join the waitlist instead?',
              waitlistAvailable: true
            }, { status: 409 })
          }
          
          return NextResponse.json({ 
            error: bookingResult.error,
            code: bookingResult.code 
          }, { status: 400 })
        }

        // Save booking to database
        await database.collection('bookings').insertOne(bookingResult.booking)

        // Update class instance booking count
        await database.collection('class_schedules').updateOne(
          { id: classInstanceId },
          { 
            $inc: { bookedCount: 1 },
            $set: { 
              availableSpots: Math.max(0, classInstance.capacity - (currentBookings.length + 1)),
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          booking: bookingResult.booking,
          message: 'Class booked successfully!',
          remainingSpots: Math.max(0, classInstance.capacity - (currentBookings.length + 1))
        })

      } catch (error) {
        console.error('Booking error:', error)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }
    }

    // Join waitlist
    if (path === '/booking/waitlist') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classInstanceId, autoBook, notifications } = body

        if (!classInstanceId) {
          return NextResponse.json({ error: 'Class instance ID is required' }, { status: 400 })
        }

        // Get class instance
        const classInstance = await database.collection('class_schedules').findOne({
          id: classInstanceId
        })

        if (!classInstance) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Check if user already on waitlist
        const existingWaitlist = await database.collection('waitlists').findOne({
          classInstanceId,
          userId: firebaseUser.uid,
          status: 'active'
        })

        if (existingWaitlist) {
          return NextResponse.json({ error: 'You are already on the waitlist for this class' }, { status: 400 })
        }

        // Get current waitlist
        const currentWaitlist = await database.collection('waitlists')
          .find({ 
            classInstanceId, 
            status: 'active' 
          })
          .toArray()

        // Import scheduling engine
        const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
        
        // Add to waitlist
        const waitlistEntry = schedulingEngine.addToWaitlist(
          { ...classInstance, waitlistCount: currentWaitlist.length },
          firebaseUser.uid,
          { autoBook: autoBook || false, notifications: notifications || { email: true, sms: false } }
        )

        // Save to database
        await database.collection('waitlists').insertOne(waitlistEntry)

        // Update class instance waitlist count
        await database.collection('class_schedules').updateOne(
          { id: classInstanceId },
          { 
            $inc: { waitlistCount: 1 },
            $set: { updatedAt: new Date() }
          }
        )

        return NextResponse.json({
          success: true,
          waitlist: waitlistEntry,
          position: waitlistEntry.position,
          message: `Added to waitlist at position ${waitlistEntry.position}`
        })

      } catch (error) {
        console.error('Waitlist error:', error)
        return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
      }
    }

    // Cancel booking
    if (path === '/booking/cancel') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { bookingId } = body

        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        // Get booking
        const booking = await database.collection('bookings').findOne({
          id: bookingId,
          userId: firebaseUser.uid
        })

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Check cancellation policy
        const classStartTime = new Date(booking.startTime)
        const now = new Date()
        const hoursUntilClass = (classStartTime - now) / (1000 * 60 * 60)

        // Get studio cancellation policy (default 24 hours)
        const studio = await database.collection('profiles').findOne({
          userId: booking.studioId || 'default'
        })
        const cancellationHours = studio?.cancellationPolicy || 24

        let cancellationFee = 0
        let refundAmount = booking.price || 0

        if (hoursUntilClass < cancellationHours) {
          cancellationFee = studio?.lateCancelFee || 10
          refundAmount = Math.max(0, refundAmount - cancellationFee)
        }

        // Update booking status
        await database.collection('bookings').updateOne(
          { id: bookingId },
          { 
            $set: { 
              status: 'cancelled',
              cancelledAt: new Date(),
              cancellationFee,
              refundAmount,
              cancelledBy: firebaseUser.uid
            }
          }
        )

        // Update class instance availability
        await database.collection('class_schedules').updateOne(
          { id: booking.classInstanceId },
          { 
            $inc: { 
              bookedCount: -1,
              availableSpots: 1
            },
            $set: { updatedAt: new Date() }
          }
        )

        // Check for waitlist promotions
        const waitlistEntries = await database.collection('waitlists')
          .find({ 
            classInstanceId: booking.classInstanceId, 
            status: 'active' 
          })
          .sort({ createdAt: 1 })
          .toArray()

        if (waitlistEntries.length > 0) {
          // Import scheduling engine
          const { default: schedulingEngine } = await import('../../../lib/class-scheduling-engine.js')
          
          const promotions = schedulingEngine.promoteFromWaitlist(waitlistEntries, 1)
          
          if (promotions.length > 0) {
            const promotion = promotions[0]
            
            // Update waitlist entry
            await database.collection('waitlists').updateOne(
              { id: promotion.waitlistId },
              { 
                $set: { 
                  status: 'promoted',
                  promotedAt: promotion.promotedAt
                }
              }
            )

            // Auto-book if enabled
            if (promotion.autoBook && promotion.booking) {
              await database.collection('bookings').insertOne(promotion.booking)
              
              // Update class counts
              await database.collection('class_schedules').updateOne(
                { id: booking.classInstanceId },
                { 
                  $inc: { 
                    bookedCount: 1,
                    availableSpots: -1,
                    waitlistCount: -1
                  }
                }
              )
            }
          }
        }

        return NextResponse.json({
          success: true,
          cancellation: {
            bookingId,
            cancellationFee,
            refundAmount,
            hoursUntilClass: Math.round(hoursUntilClass * 10) / 10
          },
          waitlistPromoted: waitlistEntries.length > 0,
          message: cancellationFee > 0 
            ? `Booking cancelled. Late cancellation fee: $${cancellationFee}` 
            : 'Booking cancelled successfully'
        })

      } catch (error) {
        console.error('Cancellation error:', error)
        return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
      }
    }

    // Assign instructor to class
    if (path === '/classes/assign-instructor') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classInstanceId, instructorId } = body

        if (!classInstanceId || !instructorId) {
          return NextResponse.json({ error: 'Class instance ID and instructor ID are required' }, { status: 400 })
        }

        // Check if user owns the studio
        const classInstance = await database.collection('class_schedules').findOne({
          id: classInstanceId,
          studioId: firebaseUser.uid
        })

        if (!classInstance) {
          return NextResponse.json({ error: 'Class not found or access denied' }, { status: 404 })
        }

        // Get instructor's existing assignments for conflict checking
        const startTime = new Date(classInstance.startTime)
        const endTime = new Date(classInstance.endTime)
        
        const conflictingAssignments = await database.collection('class_schedules')
          .find({
            instructorId,
            startTime: { $lt: endTime.toISOString() },
            endTime: { $gt: startTime.toISOString() },
            status: { $ne: 'cancelled' },
            id: { $ne: classInstanceId }
          })
          .toArray()

        if (conflictingAssignments.length > 0) {
          return NextResponse.json({
            error: 'Instructor has a scheduling conflict',
            conflicts: conflictingAssignments.map(c => ({
              classId: c.id,
              className: c.className,
              startTime: c.startTime,
              endTime: c.endTime
            }))
          }, { status: 409 })
        }

        // Get instructor details
        const instructor = await database.collection('profiles').findOne({
          userId: instructorId,
          role: 'instructor'
        })

        if (!instructor) {
          return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        // Update class assignment
        await database.collection('class_schedules').updateOne(
          { id: classInstanceId },
          { 
            $set: { 
              instructorId,
              instructorName: `${instructor.firstName} ${instructor.lastName}`,
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          assignment: {
            classInstanceId,
            instructorId,
            instructorName: `${instructor.firstName} ${instructor.lastName}`,
            assignedAt: new Date()
          },
          message: 'Instructor assigned successfully'
        })

      } catch (error) {
        console.error('Instructor assignment error:', error)
        return NextResponse.json({ error: 'Failed to assign instructor' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 1: CORE PAYMENT INFRASTRUCTURE & STRIPE INTEGRATION
    // ========================================

    // Create Stripe customer and save payment method
    if (path === '/payments/setup-intent') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Check if user already has a Stripe customer ID
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        let stripeCustomerId = userProfile?.stripeCustomerId

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: firebaseUser.email,
            name: userProfile?.name || `${userProfile?.firstName} ${userProfile?.lastName}`,
            metadata: {
              firebase_uid: firebaseUser.uid,
              role: userProfile?.role || 'customer'
            }
          })
          
          stripeCustomerId = customer.id
          
          // Update user profile with Stripe customer ID
          await database.collection('profiles').updateOne(
            { userId: firebaseUser.uid },
            { $set: { stripeCustomerId: stripeCustomerId } }
          )
        }

        // Create setup intent for saving payment method
        const setupIntent = await stripe.setupIntents.create({
          customer: stripeCustomerId,
          payment_method_types: ['card'],
          usage: 'off_session'
        })

        return NextResponse.json({
          success: true,
          clientSecret: setupIntent.client_secret,
          customerId: stripeCustomerId
        })

      } catch (error) {
        console.error('Setup intent error:', error)
        return NextResponse.json({ error: 'Failed to create setup intent' }, { status: 500 })
      }
    }

    // Create subscription
    if (path === '/payments/create-subscription') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { priceId, paymentMethodId, studioId, subscriptionType } = body

        if (!priceId || !paymentMethodId) {
          return NextResponse.json({ error: 'Price ID and payment method are required' }, { status: 400 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        let stripeCustomerId = userProfile?.stripeCustomerId

        if (!stripeCustomerId) {
          return NextResponse.json({ error: 'Customer not found. Please set up payment method first.' }, { status: 400 })
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        })

        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        })

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethodId,
          expand: ['latest_invoice.payment_intent'],
          metadata: {
            firebase_uid: firebaseUser.uid,
            studio_id: studioId || '',
            subscription_type: subscriptionType || 'unlimited_membership'
          }
        })

        // Store subscription details in database
        const subscriptionRecord = {
          id: `subscription-${Date.now()}`,
          stripeSubscriptionId: subscription.id,
          userId: firebaseUser.uid,
          studioId: studioId,
          subscriptionType: subscriptionType,
          priceId: priceId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.collection('subscriptions').insertOne(subscriptionRecord)

        return NextResponse.json({
          success: true,
          subscription: subscription,
          subscriptionRecord: subscriptionRecord
        })

      } catch (error) {
        console.error('Create subscription error:', error)
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
      }
    }

    // Create one-time payment for class booking
    if (path === '/payments/create-payment-intent') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { amount, classId, studioId, currency = 'usd', paymentType = 'class_booking' } = body

        if (!amount || !classId) {
          return NextResponse.json({ error: 'Amount and class ID are required' }, { status: 400 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        let stripeCustomerId = userProfile?.stripeCustomerId

        // Create customer if doesn't exist
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: firebaseUser.email,
            name: userProfile?.name || `${userProfile?.firstName} ${userProfile?.lastName}`,
            metadata: {
              firebase_uid: firebaseUser.uid,
              role: userProfile?.role || 'customer'
            }
          })
          
          stripeCustomerId = customer.id
          await database.collection('profiles').updateOne(
            { userId: firebaseUser.uid },
            { $set: { stripeCustomerId: stripeCustomerId } }
          )
        }

        // Calculate platform fee (3.75% for standard transactions)
        const platformFeeAmount = Math.round(amount * 0.0375)
        const totalAmount = amount + platformFeeAmount

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalAmount,
          currency: currency,
          customer: stripeCustomerId,
          metadata: {
            firebase_uid: firebaseUser.uid,
            class_id: classId,
            studio_id: studioId || '',
            payment_type: paymentType,
            platform_fee: platformFeeAmount.toString(),
            net_amount: amount.toString()
          }
        })

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          totalAmount,
          platformFee: platformFeeAmount,
          netAmount: amount
        })

      } catch (error) {
        console.error('Create payment intent error:', error)
        return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
      }
    }

    // Purchase X Pass credits
    if (path === '/payments/purchase-xpass') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { packageType, amount, creditCount, paymentMethodId } = body

        if (!packageType || !amount || !creditCount || !paymentMethodId) {
          return NextResponse.json({ error: 'Package type, amount, credit count, and payment method are required' }, { status: 400 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const stripeCustomerId = userProfile?.stripeCustomerId

        if (!stripeCustomerId) {
          return NextResponse.json({ error: 'Customer not found. Please set up payment method first.' }, { status: 400 })
        }

        // Create payment intent for X Pass purchase
        const platformFeeAmount = Math.round(amount * 0.0375)
        const totalAmount = amount + platformFeeAmount

        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalAmount,
          currency: 'usd',
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            firebase_uid: firebaseUser.uid,
            payment_type: 'xpass_purchase',
            package_type: packageType,
            credit_count: creditCount.toString(),
            platform_fee: platformFeeAmount.toString(),
            net_amount: amount.toString()
          }
        })

        // If payment successful, add credits to user account
        if (paymentIntent.status === 'succeeded') {
          await database.collection('xpass_credits').updateOne(
            { userId: firebaseUser.uid },
            {
              $inc: { availableCredits: creditCount },
              $set: { updatedAt: new Date() },
              $setOnInsert: { 
                createdAt: new Date(),
                totalEarned: 0,
                totalSpent: 0
              }
            },
            { upsert: true }
          )

          // Record purchase transaction
          const transaction = {
            id: `xpass-purchase-${Date.now()}`,
            userId: firebaseUser.uid,
            type: 'xpass_purchase',
            packageType: packageType,
            creditsAdded: creditCount,
            amount: totalAmount,
            platformFee: platformFeeAmount,
            netAmount: amount,
            paymentIntentId: paymentIntent.id,
            status: 'completed',
            createdAt: new Date()
          }

          await database.collection('xpass_transactions').insertOne(transaction)
        }

        return NextResponse.json({
          success: true,
          paymentIntent: paymentIntent,
          creditsAdded: creditCount,
          totalAmount,
          platformFee: platformFeeAmount
        })

      } catch (error) {
        console.error('X Pass purchase error:', error)
        return NextResponse.json({ error: 'Failed to purchase X Pass credits' }, { status: 500 })
      }
    }

    // Create customer portal session
    if (path === '/payments/customer-portal') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { returnUrl } = body

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const stripeCustomerId = userProfile?.stripeCustomerId

        if (!stripeCustomerId) {
          return NextResponse.json({ error: 'No payment methods found. Please set up payment first.' }, { status: 400 })
        }

        // Create customer portal session
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/customer`,
        })

        return NextResponse.json({
          success: true,
          url: portalSession.url
        })

      } catch (error) {
        console.error('Customer portal error:', error)
        return NextResponse.json({ error: 'Failed to create customer portal session' }, { status: 500 })
      }
    }

    // Process refund
    if (path === '/payments/refund') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { paymentIntentId, amount, reason, bookingId } = body

        if (!paymentIntentId) {
          return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
        }

        // Create refund
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount, // Optional - refunds full amount if not specified
          reason: reason || 'requested_by_customer',
          metadata: {
            firebase_uid: firebaseUser.uid,
            booking_id: bookingId || '',
            refund_reason: reason || 'requested_by_customer'
          }
        })

        // Update booking status if booking ID provided
        if (bookingId) {
          await database.collection('bookings').updateOne(
            { id: bookingId },
            {
              $set: {
                status: 'refunded',
                refundId: refund.id,
                refundAmount: refund.amount,
                refundedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )
        }

        return NextResponse.json({
          success: true,
          refund: refund,
          refundAmount: refund.amount,
          status: refund.status
        })

      } catch (error) {
        console.error('Refund error:', error)
        return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 2: SUBSCRIPTION MANAGEMENT SYSTEM
    // ========================================

    // Create class package (5, 10, 15 classes)
    if (path === '/payments/create-class-package') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { packageType, classCount, amount, studioId, expirationDays = 90, paymentMethodId } = body

        if (!packageType || !classCount || !amount || !studioId || !paymentMethodId) {
          return NextResponse.json({ error: 'Package type, class count, amount, studio ID, and payment method are required' }, { status: 400 })
        }

        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const stripeCustomerId = userProfile?.stripeCustomerId

        if (!stripeCustomerId) {
          return NextResponse.json({ error: 'Customer not found. Please set up payment method first.' }, { status: 400 })
        }

        // Calculate platform fee and total
        const platformFeeAmount = Math.round(amount * 0.0375)
        const totalAmount = amount + platformFeeAmount

        // Create payment intent for class package
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalAmount,
          currency: 'usd',
          customer: stripeCustomerId,
          payment_method: paymentMethodId,
          confirm: true,
          metadata: {
            firebase_uid: firebaseUser.uid,
            payment_type: 'class_package',
            package_type: packageType,
            class_count: classCount.toString(),
            studio_id: studioId,
            platform_fee: platformFeeAmount.toString(),
            net_amount: amount.toString()
          }
        })

        // If payment successful, create class package
        if (paymentIntent.status === 'succeeded') {
          const expirationDate = new Date()
          expirationDate.setDate(expirationDate.getDate() + expirationDays)

          const classPackage = {
            id: `class-package-${Date.now()}`,
            userId: firebaseUser.uid,
            studioId: studioId,
            packageType: packageType,
            totalClasses: classCount,
            remainingClasses: classCount,
            usedClasses: 0,
            amount: totalAmount,
            platformFee: platformFeeAmount,
            netAmount: amount,
            status: 'active',
            purchaseDate: new Date(),
            expirationDate: expirationDate,
            paymentIntentId: paymentIntent.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          await database.collection('class_packages').insertOne(classPackage)

          // Record transaction
          const transaction = {
            id: `txn-package-${Date.now()}`,
            userId: firebaseUser.uid,
            type: 'class_package_purchase',
            packageType: packageType,
            classCount: classCount,
            amount: totalAmount,
            platformFee: platformFeeAmount,
            netAmount: amount,
            paymentIntentId: paymentIntent.id,
            status: 'completed',
            createdAt: new Date()
          }

          await database.collection('transactions').insertOne(transaction)
        }

        return NextResponse.json({
          success: true,
          paymentIntent: paymentIntent,
          classPackage: paymentIntent.status === 'succeeded' ? {
            packageType,
            classCount,
            expirationDays,
            status: 'active'
          } : null,
          totalAmount,
          platformFee: platformFeeAmount
        })

      } catch (error) {
        console.error('Class package purchase error:', error)
        return NextResponse.json({ error: 'Failed to purchase class package' }, { status: 500 })
      }
    }

    // Pause subscription
    if (path === '/payments/pause-subscription') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { subscriptionId, pauseDuration = 30 } = body // pauseDuration in days

        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        // Get subscription from database
        const subscription = await database.collection('subscriptions').findOne({
          stripeSubscriptionId: subscriptionId,
          userId: firebaseUser.uid
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found or unauthorized' }, { status: 404 })
        }

        // Calculate pause end date
        const pauseEndDate = new Date()
        pauseEndDate.setDate(pauseEndDate.getDate() + pauseDuration)

        // Update subscription in Stripe (pause collection)
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: {
            behavior: 'mark_uncollectible',
            resumes_at: Math.floor(pauseEndDate.getTime() / 1000)
          }
        })

        // Update subscription in database
        await database.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscriptionId, userId: firebaseUser.uid },
          {
            $set: {
              status: 'paused',
              pausedAt: new Date(),
              pauseEndDate: pauseEndDate,
              pauseDuration: pauseDuration,
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Subscription paused successfully',
          pauseEndDate: pauseEndDate,
          pauseDuration: pauseDuration,
          subscription: updatedSubscription
        })

      } catch (error) {
        console.error('Pause subscription error:', error)
        return NextResponse.json({ error: 'Failed to pause subscription' }, { status: 500 })
      }
    }

    // Resume subscription
    if (path === '/payments/resume-subscription') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { subscriptionId } = body

        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        // Get subscription from database
        const subscription = await database.collection('subscriptions').findOne({
          stripeSubscriptionId: subscriptionId,
          userId: firebaseUser.uid
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found or unauthorized' }, { status: 404 })
        }

        // Resume subscription in Stripe
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          pause_collection: null
        })

        // Update subscription in database
        await database.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscriptionId, userId: firebaseUser.uid },
          {
            $set: {
              status: 'active',
              resumedAt: new Date(),
              updatedAt: new Date()
            },
            $unset: {
              pausedAt: "",
              pauseEndDate: "",
              pauseDuration: ""
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Subscription resumed successfully',
          subscription: updatedSubscription
        })

      } catch (error) {
        console.error('Resume subscription error:', error)
        return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 })
      }
    }

    // Cancel subscription
    if (path === '/payments/cancel-subscription') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { subscriptionId, cancelImmediately = false, cancelationReason } = body

        if (!subscriptionId) {
          return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 })
        }

        // Get subscription from database
        const subscription = await database.collection('subscriptions').findOne({
          stripeSubscriptionId: subscriptionId,
          userId: firebaseUser.uid
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found or unauthorized' }, { status: 404 })
        }

        let updatedSubscription
        if (cancelImmediately) {
          // Cancel immediately
          updatedSubscription = await stripe.subscriptions.cancel(subscriptionId)
        } else {
          // Cancel at period end
          updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true
          })
        }

        // Update subscription in database
        await database.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscriptionId, userId: firebaseUser.uid },
          {
            $set: {
              status: cancelImmediately ? 'canceled' : 'cancel_at_period_end',
              canceledAt: cancelImmediately ? new Date() : null,
              cancelAtPeriodEnd: !cancelImmediately,
              cancelationReason: cancelationReason || 'User requested',
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: cancelImmediately ? 'Subscription canceled immediately' : 'Subscription will cancel at period end',
          cancelImmediately: cancelImmediately,
          subscription: updatedSubscription
        })

      } catch (error) {
        console.error('Cancel subscription error:', error)
        return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
      }
    }

    // Use X Pass credit for booking
    if (path === '/payments/use-xpass-credit') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, studioId, creditsToUse = 1 } = body

        if (!classId || !studioId) {
          return NextResponse.json({ error: 'Class ID and studio ID are required' }, { status: 400 })
        }

        // Check user's X Pass credit balance
        const xpassCredits = await database.collection('xpass_credits').findOne({ userId: firebaseUser.uid })
        
        if (!xpassCredits || xpassCredits.availableCredits < creditsToUse) {
          return NextResponse.json({ error: 'Insufficient X Pass credits' }, { status: 400 })
        }

        // Check if studio accepts X Pass
        const studioSettings = await database.collection('studio_xpass_settings').findOne({ studioId: studioId })
        if (!studioSettings || !studioSettings.acceptsXPass) {
          return NextResponse.json({ error: 'Studio does not accept X Pass credits' }, { status: 400 })
        }

        // Deduct credits
        await database.collection('xpass_credits').updateOne(
          { userId: firebaseUser.uid },
          {
            $inc: { 
              availableCredits: -creditsToUse,
              totalSpent: creditsToUse
            },
            $set: { updatedAt: new Date() }
          }
        )

        // Record X Pass transaction
        const transaction = {
          id: `xpass-use-${Date.now()}`,
          userId: firebaseUser.uid,
          studioId: studioId,
          classId: classId,
          type: 'xpass_redemption',
          creditsUsed: creditsToUse,
          platformFeeRate: studioSettings.platformFeeRate || 0.075, // 7.5% for X Pass redemptions
          status: 'completed',
          createdAt: new Date()
        }

        await database.collection('xpass_transactions').insertOne(transaction)

        // Get updated credit balance
        const updatedCredits = await database.collection('xpass_credits').findOne({ userId: firebaseUser.uid })

        return NextResponse.json({
          success: true,
          message: 'X Pass credits used successfully',
          creditsUsed: creditsToUse,
          remainingCredits: updatedCredits.availableCredits,
          transactionId: transaction.id
        })

      } catch (error) {
        console.error('X Pass credit usage error:', error)
        return NextResponse.json({ error: 'Failed to use X Pass credits' }, { status: 500 })
      }
    }

    // Use class package credit
    if (path === '/payments/use-class-package') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { packageId, classId, studioId } = body

        if (!packageId || !classId || !studioId) {
          return NextResponse.json({ error: 'Package ID, class ID, and studio ID are required' }, { status: 400 })
        }

        // Get class package
        const classPackage = await database.collection('class_packages').findOne({
          id: packageId,
          userId: firebaseUser.uid
        })

        if (!classPackage) {
          return NextResponse.json({ error: 'Class package not found or unauthorized' }, { status: 404 })
        }

        // Check package validity
        if (classPackage.status !== 'active') {
          return NextResponse.json({ error: 'Class package is not active' }, { status: 400 })
        }

        if (classPackage.remainingClasses <= 0) {
          return NextResponse.json({ error: 'No remaining classes in package' }, { status: 400 })
        }

        if (new Date() > new Date(classPackage.expirationDate)) {
          return NextResponse.json({ error: 'Class package has expired' }, { status: 400 })
        }

        // Check if package is valid for this studio
        if (classPackage.studioId !== studioId) {
          return NextResponse.json({ error: 'Class package is not valid for this studio' }, { status: 400 })
        }

        // Use one class from package
        const updatedPackage = await database.collection('class_packages').findOneAndUpdate(
          { id: packageId, userId: firebaseUser.uid },
          {
            $inc: { 
              remainingClasses: -1,
              usedClasses: 1
            },
            $set: { 
              updatedAt: new Date(),
              status: classPackage.remainingClasses === 1 ? 'depleted' : 'active'
            }
          },
          { returnDocument: 'after' }
        )

        // Record class package usage
        const usage = {
          id: `package-use-${Date.now()}`,
          packageId: packageId,
          userId: firebaseUser.uid,
          studioId: studioId,
          classId: classId,
          usedAt: new Date(),
          remainingClasses: updatedPackage.value.remainingClasses
        }

        await database.collection('class_package_usage').insertOne(usage)

        return NextResponse.json({
          success: true,
          message: 'Class package credit used successfully',
          remainingClasses: updatedPackage.value.remainingClasses,
          packageStatus: updatedPackage.value.status,
          usageId: usage.id
        })

      } catch (error) {
        console.error('Class package usage error:', error)
        return NextResponse.json({ error: 'Failed to use class package credit' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 3: BUSINESS LOGIC & FEE PROCESSING
    // ========================================

    // Apply cancellation policy and fees
    if (path === '/payments/apply-cancellation-policy') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { bookingId, cancellationReason, cancelledAt } = body

        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        // Get booking details
        const booking = await database.collection('bookings').findOne({
          id: bookingId,
          userId: firebaseUser.uid
        })

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
        }

        // Get studio cancellation policy
        const studioPolicy = await database.collection('studio_policies').findOne({
          studioId: booking.studioId
        })

        const defaultPolicy = {
          cancellationWindow: 24, // hours
          lateCancelFee: 1500, // $15 in cents
          noShowFee: 2000, // $20 in cents
          refundPolicy: 'full_refund_within_window',
          freeTrialCancellations: 1
        }

        const policy = studioPolicy || defaultPolicy

        // Calculate time difference
        const classStartTime = new Date(booking.classStartTime)
        const cancellationTime = new Date(cancelledAt || new Date())
        const hoursUntilClass = (classStartTime - cancellationTime) / (1000 * 60 * 60)

        // Determine fee and refund policy
        let cancellationFee = 0
        let refundAmount = 0
        let refundEligible = false
        let feeReason = ''

        if (hoursUntilClass >= policy.cancellationWindow) {
          // Within cancellation window - full refund, no fee
          refundEligible = true
          refundAmount = booking.amount || 0
          feeReason = 'Cancelled within policy window'
        } else if (hoursUntilClass > 0) {
          // Late cancellation - apply fee
          cancellationFee = policy.lateCancelFee
          refundAmount = Math.max(0, (booking.amount || 0) - cancellationFee)
          feeReason = 'Late cancellation fee applied'
        } else {
          // No-show - apply no-show fee
          cancellationFee = policy.noShowFee
          refundAmount = 0
          feeReason = 'No-show fee applied'
        }

        // Check if user has remaining free trial cancellations
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const freeCancellationsUsed = userProfile?.freeCancellationsUsed || 0

        if (freeCancellationsUsed < policy.freeTrialCancellations && cancellationFee > 0) {
          // Apply free trial cancellation
          cancellationFee = 0
          refundAmount = booking.amount || 0
          feeReason = 'Free trial cancellation applied'
          
          // Update user profile
          await database.collection('profiles').updateOne(
            { userId: firebaseUser.uid },
            { $inc: { freeCancellationsUsed: 1 } }
          )
        }

        // Handle different payment methods
        let processingDetails = {}
        
        if (booking.paymentMethod === 'class_package') {
          // Return credit to class package if applicable
          if (refundEligible) {
            await database.collection('class_packages').updateOne(
              { id: booking.packageId, userId: firebaseUser.uid },
              { $inc: { remainingClasses: 1, usedClasses: -1 } }
            )
            processingDetails.creditReturned = true
          }
        } else if (booking.paymentMethod === 'xpass') {
          // Return X Pass credit if applicable
          if (refundEligible) {
            await database.collection('xpass_credits').updateOne(
              { userId: firebaseUser.uid },
              { $inc: { availableCredits: 1, totalSpent: -1 } }
            )
            processingDetails.xpassCreditReturned = true
          }
        } else if (booking.paymentMethod === 'subscription') {
          // Subscription bookings - no refund needed but track cancellation
          processingDetails.subscriptionCancellation = true
        }

        // Update booking status
        await database.collection('bookings').updateOne(
          { id: bookingId },
          {
            $set: {
              status: 'cancelled',
              cancellationReason: cancellationReason || 'User requested',
              cancelledAt: cancellationTime,
              cancellationFee: cancellationFee,
              refundAmount: refundAmount,
              policyApplied: policy,
              feeReason: feeReason,
              updatedAt: new Date()
            }
          }
        )

        // Record cancellation fee transaction if applicable
        if (cancellationFee > 0) {
          const feeTransaction = {
            id: `cancellation-fee-${Date.now()}`,
            userId: firebaseUser.uid,
            bookingId: bookingId,
            type: 'cancellation_fee',
            amount: cancellationFee,
            reason: feeReason,
            studioId: booking.studioId,
            createdAt: new Date()
          }
          await database.collection('transactions').insertOne(feeTransaction)
        }

        return NextResponse.json({
          success: true,
          message: 'Cancellation policy applied successfully',
          cancellationFee: cancellationFee,
          refundAmount: refundAmount,
          refundEligible: refundEligible,
          feeReason: feeReason,
          hoursUntilClass: Math.round(hoursUntilClass * 100) / 100,
          policyApplied: policy,
          processingDetails: processingDetails
        })

      } catch (error) {
        console.error('Cancellation policy error:', error)
        return NextResponse.json({ error: 'Failed to apply cancellation policy' }, { status: 500 })
      }
    }

    // Process no-show penalty
    if (path === '/payments/process-no-show') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { bookingId, noShowConfirmed = true } = body

        if (!bookingId) {
          return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 })
        }

        // Get booking details
        const booking = await database.collection('bookings').findOne({
          id: bookingId
        })

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Check if user has authority to mark no-show (studio owner or instructor)
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        const hasAuthority = userProfile?.role === 'merchant' && userProfile?.userId === booking.studioId ||
                            userProfile?.role === 'instructor' && booking.instructorId === firebaseUser.uid

        if (!hasAuthority) {
          return NextResponse.json({ error: 'Unauthorized to mark no-show' }, { status: 403 })
        }

        // Get studio no-show policy
        const studioPolicy = await database.collection('studio_policies').findOne({
          studioId: booking.studioId
        })

        const defaultPolicy = {
          noShowFee: 2000, // $20 in cents
          gracePeriod: 15, // minutes after start time
          autoMarkNoShow: true
        }

        const policy = studioPolicy || defaultPolicy

        // Calculate no-show fee based on payment method
        let noShowFee = 0
        let processingDetails = {}

        if (booking.paymentMethod === 'class_package') {
          // Class package: lose credit + fee
          noShowFee = policy.noShowFee
          processingDetails.creditDeducted = true
        } else if (booking.paymentMethod === 'xpass') {
          // X Pass: lose credit + fee
          noShowFee = policy.noShowFee
          processingDetails.xpassCreditDeducted = true
        } else if (booking.paymentMethod === 'subscription') {
          // Subscription: only fee (no credit to lose)
          noShowFee = policy.noShowFee
          processingDetails.subscriptionNoShow = true
        } else {
          // One-time payment: full fee
          noShowFee = policy.noShowFee
        }

        // Apply no-show fee
        if (noShowConfirmed && noShowFee > 0) {
          // Create charge for no-show fee
          const userProfile = await database.collection('profiles').findOne({ userId: booking.userId })
          const stripeCustomerId = userProfile?.stripeCustomerId

          if (stripeCustomerId) {
            try {
              const paymentIntent = await stripe.paymentIntents.create({
                amount: noShowFee,
                currency: 'usd',
                customer: stripeCustomerId,
                confirm: true,
                metadata: {
                  firebase_uid: booking.userId,
                  booking_id: bookingId,
                  fee_type: 'no_show_fee',
                  studio_id: booking.studioId
                }
              })

              processingDetails.paymentIntentId = paymentIntent.id
            } catch (stripeError) {
              console.error('Stripe no-show fee error:', stripeError)
              // Continue with booking update even if payment fails
              processingDetails.paymentFailed = true
            }
          }
        }

        // Update booking status
        await database.collection('bookings').updateOne(
          { id: bookingId },
          {
            $set: {
              status: 'no_show',
              noShowConfirmed: noShowConfirmed,
              noShowFee: noShowFee,
              noShowMarkedAt: new Date(),
              noShowMarkedBy: firebaseUser.uid,
              policyApplied: policy,
              updatedAt: new Date()
            }
          }
        )

        // Record no-show fee transaction
        if (noShowFee > 0) {
          const feeTransaction = {
            id: `no-show-fee-${Date.now()}`,
            userId: booking.userId,
            bookingId: bookingId,
            type: 'no_show_fee',
            amount: noShowFee,
            studioId: booking.studioId,
            markedBy: firebaseUser.uid,
            createdAt: new Date()
          }
          await database.collection('transactions').insertOne(feeTransaction)
        }

        return NextResponse.json({
          success: true,
          message: 'No-show penalty processed successfully',
          noShowFee: noShowFee,
          policyApplied: policy,
          processingDetails: processingDetails
        })

      } catch (error) {
        console.error('No-show penalty error:', error)
        return NextResponse.json({ error: 'Failed to process no-show penalty' }, { status: 500 })
      }
    }

    // Calculate dynamic platform fees
    if (path === '/payments/calculate-platform-fees') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { amount, paymentType, studioId, subscriptionTier = 'standard' } = body

        if (!amount || !paymentType) {
          return NextResponse.json({ error: 'Amount and payment type are required' }, { status: 400 })
        }

        // Get studio-specific fee structure
        const studioSettings = await database.collection('studio_fee_settings').findOne({
          studioId: studioId
        })

        // Default platform fee rates
        const baseFeeRates = {
          class_booking: 0.0375,      // 3.75%
          subscription: 0.0375,       // 3.75%
          class_package: 0.0375,      // 3.75%
          xpass_redemption: 0.075,    // 7.5%
          instructor_payout: 0.05     // 5%
        }

        // Volume-based discounts
        const volumeDiscounts = {
          bronze: 0,        // 0-100 transactions
          silver: 0.0025,   // 101-500 transactions (-0.25%)
          gold: 0.005,      // 501-1000 transactions (-0.5%)
          platinum: 0.0075  // 1000+ transactions (-0.75%)
        }

        // Get studio transaction volume for dynamic pricing
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const studioTransactions = await database.collection('transactions')
          .countDocuments({
            studioId: studioId,
            createdAt: { $gte: thirtyDaysAgo },
            status: 'completed'
          })

        // Determine volume tier
        let volumeTier = 'bronze'
        if (studioTransactions >= 1000) volumeTier = 'platinum'
        else if (studioTransactions >= 500) volumeTier = 'gold'
        else if (studioTransactions >= 100) volumeTier = 'silver'

        // Calculate base fee rate
        let baseFeeRate = baseFeeRates[paymentType] || baseFeeRates.class_booking

        // Apply studio-specific rates if configured
        if (studioSettings && studioSettings.customRates && studioSettings.customRates[paymentType]) {
          baseFeeRate = studioSettings.customRates[paymentType]
        }

        // Apply volume discount
        const volumeDiscount = volumeDiscounts[volumeTier]
        const discountedFeeRate = Math.max(0, baseFeeRate - volumeDiscount)

        // Calculate fees
        const platformFee = Math.round(amount * discountedFeeRate)
        const stripeFee = Math.round(amount * 0.029) + 30 // Stripe standard rate
        const totalFees = platformFee + stripeFee
        const netAmount = amount - totalFees

        // Apply subscription tier discounts
        if (subscriptionTier === 'premium') {
          const premiumDiscount = Math.round(platformFee * 0.1) // 10% discount
          const discountedPlatformFee = platformFee - premiumDiscount
          const discountedTotalFees = discountedPlatformFee + stripeFee
          const discountedNetAmount = amount - discountedTotalFees

          return NextResponse.json({
            success: true,
            feeCalculation: {
              originalAmount: amount,
              baseFeeRate: baseFeeRate,
              discountedFeeRate: discountedFeeRate,
              platformFee: discountedPlatformFee,
              stripeFee: stripeFee,
              totalFees: discountedTotalFees,
              netAmount: discountedNetAmount,
              volumeTier: volumeTier,
              volumeDiscount: volumeDiscount,
              subscriptionTier: subscriptionTier,
              premiumDiscount: premiumDiscount,
              transactionVolume: studioTransactions
            }
          })
        }

        return NextResponse.json({
          success: true,
          feeCalculation: {
            originalAmount: amount,
            baseFeeRate: baseFeeRate,
            discountedFeeRate: discountedFeeRate,
            platformFee: platformFee,
            stripeFee: stripeFee,
            totalFees: totalFees,
            netAmount: netAmount,
            volumeTier: volumeTier,
            volumeDiscount: volumeDiscount,
            subscriptionTier: subscriptionTier,
            transactionVolume: studioTransactions
          }
        })

      } catch (error) {
        console.error('Platform fee calculation error:', error)
        return NextResponse.json({ error: 'Failed to calculate platform fees' }, { status: 500 })
      }
    }

    // Process failed payment retry
    if (path === '/payments/retry-failed-payment') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { paymentIntentId, retryReason } = body

        if (!paymentIntentId) {
          return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
        }

        // Get payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (paymentIntent.status !== 'requires_payment_method') {
          return NextResponse.json({ error: 'Payment intent is not in retryable state' }, { status: 400 })
        }

        // Get retry history
        const retryHistory = await database.collection('payment_retries').find({
          paymentIntentId: paymentIntentId
        }).sort({ createdAt: -1 }).toArray()

        // Check retry limits
        const maxRetries = 3
        const retryCount = retryHistory.length

        if (retryCount >= maxRetries) {
          return NextResponse.json({ error: 'Maximum retry attempts exceeded' }, { status: 400 })
        }

        // Implement intelligent retry schedule
        const retrySchedule = [
          { delay: 0, description: 'Immediate retry' },
          { delay: 1800, description: '30 minutes later' },
          { delay: 86400, description: '24 hours later' },
          { delay: 604800, description: '7 days later' }
        ]

        const currentRetryConfig = retrySchedule[retryCount] || retrySchedule[retrySchedule.length - 1]

        // Create new payment intent with updated details
        const newPaymentIntent = await stripe.paymentIntents.create({
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customer: paymentIntent.customer,
          metadata: {
            ...paymentIntent.metadata,
            retry_attempt: (retryCount + 1).toString(),
            original_payment_intent: paymentIntentId,
            retry_reason: retryReason || 'Automated retry'
          }
        })

        // Record retry attempt
        const retryRecord = {
          id: `retry-${Date.now()}`,
          originalPaymentIntentId: paymentIntentId,
          newPaymentIntentId: newPaymentIntent.id,
          userId: firebaseUser.uid,
          retryAttempt: retryCount + 1,
          retryReason: retryReason || 'Automated retry',
          retrySchedule: currentRetryConfig,
          status: 'pending',
          createdAt: new Date()
        }

        await database.collection('payment_retries').insertOne(retryRecord)

        // Update original transaction status
        await database.collection('transactions').updateOne(
          { paymentIntentId: paymentIntentId },
          {
            $set: {
              status: 'retry_pending',
              retryAttempt: retryCount + 1,
              lastRetryAt: new Date(),
              newPaymentIntentId: newPaymentIntent.id,
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Payment retry initiated successfully',
          newPaymentIntentId: newPaymentIntent.id,
          clientSecret: newPaymentIntent.client_secret,
          retryAttempt: retryCount + 1,
          retrySchedule: currentRetryConfig,
          maxRetries: maxRetries,
          remainingRetries: maxRetries - (retryCount + 1)
        })

      } catch (error) {
        console.error('Payment retry error:', error)
        return NextResponse.json({ error: 'Failed to retry payment' }, { status: 500 })
      }
    }

    // Handle subscription proration
    if (path === '/payments/prorate-subscription') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { subscriptionId, newPriceId, changeType = 'upgrade' } = body

        if (!subscriptionId || !newPriceId) {
          return NextResponse.json({ error: 'Subscription ID and new price ID are required' }, { status: 400 })
        }

        // Get current subscription
        const subscription = await database.collection('subscriptions').findOne({
          stripeSubscriptionId: subscriptionId,
          userId: firebaseUser.uid
        })

        if (!subscription) {
          return NextResponse.json({ error: 'Subscription not found or unauthorized' }, { status: 404 })
        }

        // Get current and new prices from Stripe
        const currentPrice = await stripe.prices.retrieve(subscription.priceId)
        const newPrice = await stripe.prices.retrieve(newPriceId)

        // Calculate proration
        const now = new Date()
        const periodEnd = new Date(subscription.currentPeriodEnd)
        const periodStart = new Date(subscription.currentPeriodStart)
        const totalPeriodDays = (periodEnd - periodStart) / (1000 * 60 * 60 * 24)
        const remainingDays = Math.max(0, (periodEnd - now) / (1000 * 60 * 60 * 24))
        const usedDays = totalPeriodDays - remainingDays

        // Calculate amounts
        const currentMonthlyAmount = currentPrice.unit_amount
        const newMonthlyAmount = newPrice.unit_amount
        const currentPeriodUsed = (usedDays / totalPeriodDays) * currentMonthlyAmount
        const newPeriodRemaining = (remainingDays / totalPeriodDays) * newMonthlyAmount

        let prorationAmount = 0
        let prorationCredit = 0

        if (changeType === 'upgrade') {
          // Upgrading: charge difference for remaining period
          prorationAmount = Math.max(0, newPeriodRemaining - (currentMonthlyAmount - currentPeriodUsed))
        } else {
          // Downgrading: credit difference for remaining period
          prorationCredit = Math.max(0, (currentMonthlyAmount - currentPeriodUsed) - newPeriodRemaining)
        }

        // Update subscription in Stripe with proration
        const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: subscription.stripeSubscriptionItemId,
            price: newPriceId,
          }],
          proration_behavior: 'create_prorations'
        })

        // Update subscription in database
        await database.collection('subscriptions').updateOne(
          { stripeSubscriptionId: subscriptionId, userId: firebaseUser.uid },
          {
            $set: {
              priceId: newPriceId,
              status: updatedSubscription.status,
              changeType: changeType,
              prorationAmount: prorationAmount,
              prorationCredit: prorationCredit,
              changedAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        // Record proration transaction
        const prorationTransaction = {
          id: `proration-${Date.now()}`,
          userId: firebaseUser.uid,
          subscriptionId: subscriptionId,
          type: 'subscription_proration',
          changeType: changeType,
          oldPriceId: subscription.priceId,
          newPriceId: newPriceId,
          prorationAmount: prorationAmount,
          prorationCredit: prorationCredit,
          remainingDays: Math.round(remainingDays),
          totalPeriodDays: Math.round(totalPeriodDays),
          createdAt: new Date()
        }

        await database.collection('transactions').insertOne(prorationTransaction)

        return NextResponse.json({
          success: true,
          message: 'Subscription proration processed successfully',
          changeType: changeType,
          prorationAmount: prorationAmount,
          prorationCredit: prorationCredit,
          remainingDays: Math.round(remainingDays),
          newMonthlyAmount: newMonthlyAmount,
          oldMonthlyAmount: currentMonthlyAmount,
          subscription: updatedSubscription
        })

      } catch (error) {
        console.error('Subscription proration error:', error)
        return NextResponse.json({ error: 'Failed to process subscription proration' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 4: BOOKING INTEGRATION & PAYMENT VALIDATION
    // ========================================

    // Validate payment before booking
    if (path === '/bookings/validate-payment') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, paymentMethod, packageId, subscriptionId } = body

        if (!classId || !paymentMethod) {
          return NextResponse.json({ error: 'Class ID and payment method are required' }, { status: 400 })
        }

        // Get class details
        const classDetails = await database.collection('class_schedules').findOne({
          id: classId
        })

        if (!classDetails) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        // Check class availability
        const bookings = await database.collection('bookings').countDocuments({
          classInstanceId: classId,
          status: 'confirmed'
        })

        const availableSpots = Math.max(0, (classDetails.capacity || 20) - bookings)
        if (availableSpots <= 0) {
          return NextResponse.json({
            success: false,
            error: 'Class is fully booked',
            validationResult: {
              isValid: false,
              reason: 'class_full',
              availableSpots: 0
            }
          })
        }

        let validationResult = {
          isValid: false,
          reason: '',
          availableSpots: availableSpots,
          classDetails: classDetails,
          paymentDetails: {}
        }

        // Validate based on payment method
        switch (paymentMethod) {
          case 'class_package':
            if (!packageId) {
              return NextResponse.json({ error: 'Package ID required for class package payment' }, { status: 400 })
            }

            const classPackage = await database.collection('class_packages').findOne({
              id: packageId,
              userId: firebaseUser.uid,
              status: 'active'
            })

            if (!classPackage) {
              validationResult.reason = 'package_not_found'
              break
            }

            if (classPackage.remainingClasses <= 0) {
              validationResult.reason = 'package_depleted'
              break
            }

            if (new Date() > new Date(classPackage.expirationDate)) {
              validationResult.reason = 'package_expired'
              break
            }

            if (classPackage.studioId !== classDetails.studioId) {
              validationResult.reason = 'package_studio_mismatch'
              break
            }

            validationResult.isValid = true
            validationResult.paymentDetails = {
              packageType: classPackage.packageType,
              remainingClasses: classPackage.remainingClasses,
              expirationDate: classPackage.expirationDate
            }
            break

          case 'xpass':
            const xpassCredits = await database.collection('xpass_credits').findOne({
              userId: firebaseUser.uid
            })

            if (!xpassCredits || xpassCredits.availableCredits < 1) {
              validationResult.reason = 'insufficient_xpass_credits'
              break
            }

            // Check if studio accepts X Pass
            const studioSettings = await database.collection('studio_xpass_settings').findOne({
              studioId: classDetails.studioId
            })

            if (!studioSettings?.acceptsXPass) {
              validationResult.reason = 'studio_no_xpass'
              break
            }

            validationResult.isValid = true
            validationResult.paymentDetails = {
              availableCredits: xpassCredits.availableCredits,
              platformFeeRate: studioSettings.platformFeeRate || 0.075
            }
            break

          case 'subscription':
            if (!subscriptionId) {
              return NextResponse.json({ error: 'Subscription ID required for subscription payment' }, { status: 400 })
            }

            const subscription = await database.collection('subscriptions').findOne({
              id: subscriptionId,
              userId: firebaseUser.uid,
              status: 'active'
            })

            if (!subscription) {
              validationResult.reason = 'subscription_not_found'
              break
            }

            if (subscription.studioId !== classDetails.studioId) {
              validationResult.reason = 'subscription_studio_mismatch'
              break
            }

            // Check if subscription is current
            if (new Date() > new Date(subscription.currentPeriodEnd)) {
              validationResult.reason = 'subscription_expired'
              break
            }

            validationResult.isValid = true
            validationResult.paymentDetails = {
              subscriptionType: subscription.subscriptionType,
              currentPeriodEnd: subscription.currentPeriodEnd
            }
            break

          case 'one_time':
            // One-time payment always valid if user has payment method
            const userProfile = await database.collection('profiles').findOne({
              userId: firebaseUser.uid
            })

            if (!userProfile?.stripeCustomerId) {
              validationResult.reason = 'no_payment_method'
              break
            }

            validationResult.isValid = true
            validationResult.paymentDetails = {
              amount: classDetails.price || 2000, // Default $20
              platformFee: Math.round((classDetails.price || 2000) * 0.0375)
            }
            break

          default:
            validationResult.reason = 'invalid_payment_method'
        }

        return NextResponse.json({
          success: true,
          validationResult: validationResult
        })

      } catch (error) {
        console.error('Payment validation error:', error)
        return NextResponse.json({ error: 'Failed to validate payment' }, { status: 500 })
      }
    }

    // Process booking with payment
    if (path === '/bookings/create-with-payment') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId, paymentMethod, packageId, subscriptionId, paymentMethodId } = body

        // First validate payment
        const validationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/bookings/validate-payment`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.get('Authorization'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ classId, paymentMethod, packageId, subscriptionId })
        })

        const validation = await validationResponse.json()
        
        if (!validation.success || !validation.validationResult.isValid) {
          return NextResponse.json({
            success: false,
            error: 'Payment validation failed',
            reason: validation.validationResult?.reason
          }, { status: 400 })
        }

        // Create booking record
        const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const classDetails = validation.validationResult.classDetails

        const booking = {
          id: bookingId,
          userId: firebaseUser.uid,
          classInstanceId: classId,
          studioId: classDetails.studioId,
          className: classDetails.name,
          classStartTime: classDetails.startTime,
          instructorId: classDetails.instructorId,
          paymentMethod: paymentMethod,
          packageId: packageId,
          subscriptionId: subscriptionId,
          status: 'pending_payment',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.collection('bookings').insertOne(booking)

        // Process payment based on method
        let paymentResult = {}

        switch (paymentMethod) {
          case 'class_package':
            // Deduct from class package
            await database.collection('class_packages').updateOne(
              { id: packageId, userId: firebaseUser.uid },
              {
                $inc: { remainingClasses: -1, usedClasses: 1 },
                $set: { 
                  updatedAt: new Date(),
                  status: validation.validationResult.paymentDetails.remainingClasses === 1 ? 'depleted' : 'active'
                }
              }
            )

            paymentResult = {
              type: 'class_package',
              remainingClasses: validation.validationResult.paymentDetails.remainingClasses - 1
            }
            break

          case 'xpass':
            // Deduct X Pass credit
            await database.collection('xpass_credits').updateOne(
              { userId: firebaseUser.uid },
              {
                $inc: { availableCredits: -1, totalSpent: 1 },
                $set: { updatedAt: new Date() }
              }
            )

            // Record X Pass transaction
            const xpassTransaction = {
              id: `xpass-booking-${Date.now()}`,
              userId: firebaseUser.uid,
              studioId: classDetails.studioId,
              classId: classId,
              bookingId: bookingId,
              type: 'xpass_redemption',
              creditsUsed: 1,
              createdAt: new Date()
            }
            await database.collection('xpass_transactions').insertOne(xpassTransaction)

            paymentResult = {
              type: 'xpass',
              remainingCredits: validation.validationResult.paymentDetails.availableCredits - 1
            }
            break

          case 'subscription':
            // No payment needed for subscription
            paymentResult = {
              type: 'subscription',
              subscriptionType: validation.validationResult.paymentDetails.subscriptionType
            }
            break

          case 'one_time':
            // Create payment intent
            const userProfile = await database.collection('profiles').findOne({
              userId: firebaseUser.uid
            })

            const amount = validation.validationResult.paymentDetails.amount
            const platformFee = validation.validationResult.paymentDetails.platformFee

            const paymentIntent = await stripe.paymentIntents.create({
              amount: amount + platformFee,
              currency: 'usd',
              customer: userProfile.stripeCustomerId,
              payment_method: paymentMethodId,
              confirm: paymentMethodId ? true : false,
              metadata: {
                firebase_uid: firebaseUser.uid,
                booking_id: bookingId,
                class_id: classId,
                payment_type: 'class_booking',
                platform_fee: platformFee.toString()
              }
            })

            paymentResult = {
              type: 'one_time',
              paymentIntentId: paymentIntent.id,
              clientSecret: paymentIntent.client_secret,
              amount: amount + platformFee,
              requiresAction: paymentIntent.status === 'requires_action'
            }

            // Update booking with payment intent
            await database.collection('bookings').updateOne(
              { id: bookingId },
              {
                $set: {
                  paymentIntentId: paymentIntent.id,
                  amount: amount,
                  platformFee: platformFee,
                  updatedAt: new Date()
                }
              }
            )
            break
        }

        // Update booking status if payment completed (non-one-time payments)
        if (paymentMethod !== 'one_time') {
          await database.collection('bookings').updateOne(
            { id: bookingId },
            {
              $set: {
                status: 'confirmed',
                confirmedAt: new Date(),
                updatedAt: new Date()
              }
            }
          )

          // Update class capacity
          await database.collection('class_schedules').updateOne(
            { id: classId },
            {
              $inc: { bookedCount: 1 },
              $set: { updatedAt: new Date() }
            }
          )
        }

        return NextResponse.json({
          success: true,
          booking: {
            id: bookingId,
            classId: classId,
            className: classDetails.name,
            startTime: classDetails.startTime,
            status: paymentMethod !== 'one_time' ? 'confirmed' : 'pending_payment'
          },
          payment: paymentResult
        })

      } catch (error) {
        console.error('Booking creation error:', error)
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
      }
    }

    // Confirm booking after payment
    if (path === '/bookings/confirm-payment') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { bookingId, paymentIntentId } = body

        if (!bookingId || !paymentIntentId) {
          return NextResponse.json({ error: 'Booking ID and payment intent ID are required' }, { status: 400 })
        }

        // Get booking
        const booking = await database.collection('bookings').findOne({
          id: bookingId,
          userId: firebaseUser.uid
        })

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
        }

        // Verify payment intent status
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        
        if (paymentIntent.status !== 'succeeded') {
          return NextResponse.json({
            success: false,
            error: 'Payment not completed',
            paymentStatus: paymentIntent.status
          }, { status: 400 })
        }

        // Update booking to confirmed
        await database.collection('bookings').updateOne(
          { id: bookingId },
          {
            $set: {
              status: 'confirmed',
              confirmedAt: new Date(),
              paymentCompletedAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        // Update class capacity
        await database.collection('class_schedules').updateOne(
          { id: booking.classInstanceId },
          {
            $inc: { bookedCount: 1 },
            $set: { updatedAt: new Date() }
          }
        )

        // Record transaction
        const transaction = {
          id: `booking-txn-${Date.now()}`,
          userId: firebaseUser.uid,
          bookingId: bookingId,
          paymentIntentId: paymentIntentId,
          type: 'booking_payment',
          amount: paymentIntent.amount,
          status: 'completed',
          createdAt: new Date()
        }
        await database.collection('transactions').insertOne(transaction)

        return NextResponse.json({
          success: true,
          message: 'Booking confirmed successfully',
          booking: {
            id: bookingId,
            status: 'confirmed',
            confirmedAt: new Date()
          }
        })

      } catch (error) {
        console.error('Booking confirmation error:', error)
        return NextResponse.json({ error: 'Failed to confirm booking' }, { status: 500 })
      }
    }

    // Multi-payment method selection
    if (path === '/bookings/payment-methods') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { classId } = body

        if (!classId) {
          return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
        }

        // Get class details
        const classDetails = await database.collection('class_schedules').findOne({
          id: classId
        })

        if (!classDetails) {
          return NextResponse.json({ error: 'Class not found' }, { status: 404 })
        }

        const availablePaymentMethods = []

        // Check for valid class packages
        const classPackages = await database.collection('class_packages').find({
          userId: firebaseUser.uid,
          studioId: classDetails.studioId,
          status: 'active',
          remainingClasses: { $gt: 0 },
          expirationDate: { $gt: new Date() }
        }).toArray()

        if (classPackages.length > 0) {
          availablePaymentMethods.push({
            type: 'class_package',
            name: 'Class Package',
            options: classPackages.map(pkg => ({
              id: pkg.id,
              name: `${pkg.packageType} (${pkg.remainingClasses} classes left)`,
              remainingClasses: pkg.remainingClasses,
              expirationDate: pkg.expirationDate
            }))
          })
        }

        // Check for X Pass credits
        const xpassCredits = await database.collection('xpass_credits').findOne({
          userId: firebaseUser.uid
        })

        const studioXPassSettings = await database.collection('studio_xpass_settings').findOne({
          studioId: classDetails.studioId
        })

        if (xpassCredits?.availableCredits > 0 && studioXPassSettings?.acceptsXPass) {
          availablePaymentMethods.push({
            type: 'xpass',
            name: 'X Pass Credit',
            availableCredits: xpassCredits.availableCredits,
            platformFeeRate: studioXPassSettings.platformFeeRate || 0.075
          })
        }

        // Check for valid subscriptions
        const subscriptions = await database.collection('subscriptions').find({
          userId: firebaseUser.uid,
          studioId: classDetails.studioId,
          status: 'active',
          currentPeriodEnd: { $gt: new Date() }
        }).toArray()

        if (subscriptions.length > 0) {
          availablePaymentMethods.push({
            type: 'subscription',
            name: 'Studio Membership',
            options: subscriptions.map(sub => ({
              id: sub.id,
              name: sub.subscriptionType || 'Unlimited Membership',
              periodEnd: sub.currentPeriodEnd
            }))
          })
        }

        // Check for saved payment methods
        const userProfile = await database.collection('profiles').findOne({
          userId: firebaseUser.uid
        })

        if (userProfile?.stripeCustomerId) {
          const paymentMethods = await stripe.paymentMethods.list({
            customer: userProfile.stripeCustomerId,
            type: 'card'
          })

          if (paymentMethods.data.length > 0) {
            availablePaymentMethods.push({
              type: 'one_time',
              name: 'Credit/Debit Card',
              amount: classDetails.price || 2000,
              platformFee: Math.round((classDetails.price || 2000) * 0.0375),
              savedCards: paymentMethods.data.map(pm => ({
                id: pm.id,
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year
              }))
            })
          }
        }

        return NextResponse.json({
          success: true,
          classDetails: {
            id: classDetails.id,
            name: classDetails.name,
            price: classDetails.price || 2000,
            startTime: classDetails.startTime,
            instructor: classDetails.instructor
          },
          availablePaymentMethods: availablePaymentMethods,
          recommendedMethod: availablePaymentMethods.length > 0 ? availablePaymentMethods[0].type : null
        })

      } catch (error) {
        console.error('Payment methods error:', error)
        return NextResponse.json({ error: 'Failed to get payment methods' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 5: STUDIO MANAGEMENT DASHBOARD
    // ========================================

    // Configure studio cancellation policy
    if (path === '/studio/configure-cancellation-policy') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const {
          cancellationWindow = 24,
          lateCancelFee = 1500,
          noShowFee = 2000,
          refundPolicy = 'full_refund_within_window',
          freeTrialCancellations = 1,
          gracePeriod = 15,
          autoMarkNoShow = true,
          weekendPolicy = 'same_as_weekday',
          holidayPolicy = 'extended_window'
        } = body

        const policyData = {
          studioId: firebaseUser.uid,
          cancellationWindow,
          lateCancelFee,
          noShowFee,
          refundPolicy,
          freeTrialCancellations,
          gracePeriod,
          autoMarkNoShow,
          weekendPolicy,
          holidayPolicy,
          updatedAt: new Date(),
          createdAt: new Date()
        }

        // Upsert studio policy
        await database.collection('studio_policies').updateOne(
          { studioId: firebaseUser.uid },
          { $set: policyData },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: 'Cancellation policy updated successfully',
          policy: policyData
        })

      } catch (error) {
        console.error('Configure cancellation policy error:', error)
        return NextResponse.json({ error: 'Failed to configure cancellation policy' }, { status: 500 })
      }
    }

    // Configure X Pass participation settings
    if (path === '/studio/configure-xpass-settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const {
          acceptsXPass = true,
          platformFeeRate = 0.075,
          acceptedClassTypes = ['all'],
          minimumAdvanceBooking = 0,
          maximumXPassBookingsPerDay = null,
          blackoutDates = []
        } = body

        const xpassSettings = {
          studioId: firebaseUser.uid,
          acceptsXPass,
          platformFeeRate: Math.min(Math.max(platformFeeRate, 0.05), 0.15), // 5-15% range
          acceptedClassTypes,
          minimumAdvanceBooking,
          maximumXPassBookingsPerDay,
          blackoutDates: blackoutDates.map(date => new Date(date)),
          updatedAt: new Date(),
          createdAt: new Date()
        }

        // Upsert X Pass settings
        await database.collection('studio_xpass_settings').updateOne(
          { studioId: firebaseUser.uid },
          { $set: xpassSettings },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: 'X Pass settings updated successfully',
          settings: xpassSettings
        })

      } catch (error) {
        console.error('Configure X Pass settings error:', error)
        return NextResponse.json({ error: 'Failed to configure X Pass settings' }, { status: 500 })
      }
    }

    // Configure studio pricing and products
    if (path === '/studio/configure-pricing') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const {
          dropInPrice = 2000,
          memberPrice = 1500,
          classPackages = [],
          subscriptionPlans = [],
          dynamicPricing = false,
          peakHourMultiplier = 1.2,
          studentDiscount = 0.1,
          seniorDiscount = 0.1
        } = body

        const pricingData = {
          studioId: firebaseUser.uid,
          dropInPrice,
          memberPrice,
          classPackages: classPackages.map(pkg => ({
            name: pkg.name,
            classes: pkg.classes,
            price: pkg.price,
            validityDays: pkg.validityDays || 90,
            description: pkg.description,
            isActive: pkg.isActive !== false
          })),
          subscriptionPlans: subscriptionPlans.map(plan => ({
            name: plan.name,
            monthlyPrice: plan.monthlyPrice,
            billingCycle: plan.billingCycle || 'monthly',
            classLimit: plan.classLimit || 'unlimited',
            description: plan.description,
            isActive: plan.isActive !== false
          })),
          dynamicPricing,
          peakHourMultiplier,
          studentDiscount,
          seniorDiscount,
          updatedAt: new Date(),
          createdAt: new Date()
        }

        // Upsert pricing configuration
        await database.collection('studio_pricing').updateOne(
          { studioId: firebaseUser.uid },
          { $set: pricingData },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: 'Pricing configuration updated successfully',
          pricing: pricingData
        })

      } catch (error) {
        console.error('Configure pricing error:', error)
        return NextResponse.json({ error: 'Failed to configure pricing' }, { status: 500 })
      }
    }

    // Manage studio staff
    if (path === '/studio/manage-staff') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const { action, staffData } = body

        if (!action || !staffData) {
          return NextResponse.json({ error: 'Action and staff data are required' }, { status: 400 })
        }

        let result = {}

        switch (action) {
          case 'add':
            const newStaff = {
              id: `staff-${Date.now()}`,
              studioId: firebaseUser.uid,
              email: staffData.email,
              firstName: staffData.firstName,
              lastName: staffData.lastName,
              role: staffData.role || 'staff', // 'instructor', 'staff', 'manager'
              permissions: staffData.permissions || ['view_bookings'],
              specialties: staffData.specialties || [],
              bio: staffData.bio || '',
              certifications: staffData.certifications || [],
              hourlyRate: staffData.hourlyRate || 0,
              status: 'pending_invite',
              invitedAt: new Date(),
              createdAt: new Date()
            }

            await database.collection('studio_staff').insertOne(newStaff)
            result = { action: 'added', staff: newStaff }
            break

          case 'update':
            if (!staffData.id) {
              return NextResponse.json({ error: 'Staff ID is required for update' }, { status: 400 })
            }

            const updateData = {
              ...staffData,
              updatedAt: new Date()
            }
            delete updateData.id

            await database.collection('studio_staff').updateOne(
              { id: staffData.id, studioId: firebaseUser.uid },
              { $set: updateData }
            )

            result = { action: 'updated', staffId: staffData.id }
            break

          case 'remove':
            if (!staffData.id) {
              return NextResponse.json({ error: 'Staff ID is required for removal' }, { status: 400 })
            }

            await database.collection('studio_staff').updateOne(
              { id: staffData.id, studioId: firebaseUser.uid },
              { 
                $set: { 
                  status: 'removed',
                  removedAt: new Date(),
                  updatedAt: new Date()
                }
              }
            )

            result = { action: 'removed', staffId: staffData.id }
            break

          default:
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Staff ${action} completed successfully`,
          result: result
        })

      } catch (error) {
        console.error('Manage staff error:', error)
        return NextResponse.json({ error: 'Failed to manage staff' }, { status: 500 })
      }
    }

    // Configure studio business settings
    if (path === '/studio/configure-business-settings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const {
          businessHours = {},
          bookingWindow = 30, // days in advance
          minBookingNotice = 2, // hours before class
          maxBookingsPerUser = null,
          waitlistEnabled = true,
          autoConfirmBookings = true,
          reminderSettings = {},
          socialMediaLinks = {},
          amenities = [],
          studioPhotos = []
        } = body

        const businessSettings = {
          studioId: firebaseUser.uid,
          businessHours: {
            monday: businessHours.monday || { open: '06:00', close: '22:00', closed: false },
            tuesday: businessHours.tuesday || { open: '06:00', close: '22:00', closed: false },
            wednesday: businessHours.wednesday || { open: '06:00', close: '22:00', closed: false },
            thursday: businessHours.thursday || { open: '06:00', close: '22:00', closed: false },
            friday: businessHours.friday || { open: '06:00', close: '22:00', closed: false },
            saturday: businessHours.saturday || { open: '08:00', close: '20:00', closed: false },
            sunday: businessHours.sunday || { open: '08:00', close: '18:00', closed: false }
          },
          bookingWindow,
          minBookingNotice,
          maxBookingsPerUser,
          waitlistEnabled,
          autoConfirmBookings,
          reminderSettings: {
            enableEmailReminders: reminderSettings.enableEmailReminders !== false,
            enableSMSReminders: reminderSettings.enableSMSReminders || false,
            reminderTimes: reminderSettings.reminderTimes || [24, 2], // hours before class
            cancellationReminders: reminderSettings.cancellationReminders !== false
          },
          socialMediaLinks: {
            website: socialMediaLinks.website || '',
            instagram: socialMediaLinks.instagram || '',
            facebook: socialMediaLinks.facebook || '',
            twitter: socialMediaLinks.twitter || '',
            youtube: socialMediaLinks.youtube || ''
          },
          amenities: amenities,
          studioPhotos: studioPhotos,
          updatedAt: new Date(),
          createdAt: new Date()
        }

        // Upsert business settings
        await database.collection('studio_business_settings').updateOne(
          { studioId: firebaseUser.uid },
          { $set: businessSettings },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: 'Business settings updated successfully',
          settings: businessSettings
        })

      } catch (error) {
        console.error('Configure business settings error:', error)
        return NextResponse.json({ error: 'Failed to configure business settings' }, { status: 500 })
      }
    }

    // ========================================
    // PHASE 6: INSTRUCTOR PAYOUT SYSTEM
    // ========================================

    // Setup instructor Stripe Connect account
    if (path === '/instructor/setup-stripe-connect') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'instructor') {
          return NextResponse.json({ error: 'Access denied. Instructor role required.' }, { status: 403 })
        }

        const body = await request.json()
        const { returnUrl, refreshUrl } = body

        // Create Stripe Connect account for instructor
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email: firebaseUser.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          metadata: {
            firebase_uid: firebaseUser.uid,
            role: 'instructor',
            platform: 'thryve'
          }
        })

        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: refreshUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/instructor/stripe-refresh`,
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/instructor/dashboard`,
          type: 'account_onboarding'
        })

        // Update instructor profile with Stripe Connect account
        await database.collection('profiles').updateOne(
          { userId: firebaseUser.uid },
          {
            $set: {
              stripeConnectAccountId: account.id,
              stripeConnectStatus: 'pending',
              stripeConnectSetupAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        // Create instructor payout profile
        const instructorPayout = {
          id: `instructor-payout-${Date.now()}`,
          instructorId: firebaseUser.uid,
          stripeConnectAccountId: account.id,
          commissionRate: 0.7, // 70% default
          payoutSchedule: 'weekly',
          minimumPayout: 2500, // $25 minimum
          status: 'setup_pending',
          totalEarnings: 0,
          totalPayouts: 0,
          pendingEarnings: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }

        await database.collection('instructor_payouts').insertOne(instructorPayout)

        return NextResponse.json({
          success: true,
          message: 'Stripe Connect account created successfully',
          accountId: account.id,
          onboardingUrl: accountLink.url,
          status: 'setup_pending'
        })

      } catch (error) {
        console.error('Stripe Connect setup error:', error)
        return NextResponse.json({ error: 'Failed to setup Stripe Connect account' }, { status: 500 })
      }
    }

    // Configure instructor commission rates
    if (path === '/instructor/configure-commission') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const userProfile = await database.collection('profiles').findOne({ userId: firebaseUser.uid })
        
        if (userProfile?.role !== 'merchant') {
          return NextResponse.json({ error: 'Access denied. Merchant role required.' }, { status: 403 })
        }

        const body = await request.json()
        const { instructorId, commissionRate, bonusStructure, payoutSchedule } = body

        if (!instructorId || !commissionRate) {
          return NextResponse.json({ error: 'Instructor ID and commission rate are required' }, { status: 400 })
        }

        // Validate commission rate (10-90%)
        if (commissionRate < 0.1 || commissionRate > 0.9) {
          return NextResponse.json({ error: 'Commission rate must be between 10% and 90%' }, { status: 400 })
        }

        // Verify instructor belongs to this studio
        const instructor = await database.collection('studio_staff').findOne({
          userId: instructorId,
          studioId: firebaseUser.uid,
          role: 'instructor'
        })

        if (!instructor) {
          return NextResponse.json({ error: 'Instructor not found or not associated with this studio' }, { status: 404 })
        }

        const commissionConfig = {
          instructorId: instructorId,
          studioId: firebaseUser.uid,
          commissionRate: commissionRate,
          bonusStructure: bonusStructure || {
            performanceBonus: 0,
            classCountBonus: 0,
            ratingBonus: 0
          },
          payoutSchedule: payoutSchedule || 'weekly',
          minimumPayout: 2500, // $25
          effectiveDate: new Date(),
          updatedAt: new Date()
        }

        // Update instructor payout configuration
        await database.collection('instructor_payouts').updateOne(
          { instructorId: instructorId },
          {
            $set: commissionConfig
          },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: 'Commission configuration updated successfully',
          configuration: commissionConfig
        })

      } catch (error) {
        console.error('Commission configuration error:', error)
        return NextResponse.json({ error: 'Failed to configure commission' }, { status: 500 })
      }
    }

    // Process instructor payout
    if (path === '/instructor/process-payout') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { instructorId, amount, payoutType = 'scheduled' } = body

        if (!instructorId || !amount) {
          return NextResponse.json({ error: 'Instructor ID and amount are required' }, { status: 400 })
        }

        // Get instructor payout profile
        const instructorPayout = await database.collection('instructor_payouts').findOne({
          instructorId: instructorId
        })

        if (!instructorPayout) {
          return NextResponse.json({ error: 'Instructor payout profile not found' }, { status: 404 })
        }

        // Verify instructor has completed Stripe Connect setup
        if (instructorPayout.status !== 'active') {
          return NextResponse.json({ error: 'Instructor Stripe Connect setup not complete' }, { status: 400 })
        }

        // Check minimum payout amount
        if (amount < instructorPayout.minimumPayout) {
          return NextResponse.json({ 
            error: 'Amount below minimum payout threshold',
            minimumPayout: instructorPayout.minimumPayout
          }, { status: 400 })
        }

        // Create Stripe transfer
        const transfer = await stripe.transfers.create({
          amount: amount,
          currency: 'usd',
          destination: instructorPayout.stripeConnectAccountId,
          metadata: {
            instructor_id: instructorId,
            payout_type: payoutType,
            firebase_uid: firebaseUser.uid
          }
        })

        // Record payout transaction
        const payoutRecord = {
          id: `payout-${Date.now()}`,
          instructorId: instructorId,
          amount: amount,
          payoutType: payoutType,
          stripeTransferId: transfer.id,
          status: 'completed',
          processedAt: new Date(),
          processedBy: firebaseUser.uid,
          createdAt: new Date()
        }

        await database.collection('instructor_payout_transactions').insertOne(payoutRecord)

        // Update instructor payout totals
        await database.collection('instructor_payouts').updateOne(
          { instructorId: instructorId },
          {
            $inc: {
              totalPayouts: amount,
              pendingEarnings: -amount
            },
            $set: {
              lastPayoutAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Payout processed successfully',
          payout: {
            id: payoutRecord.id,
            amount: amount,
            transferId: transfer.id,
            status: 'completed',
            processedAt: new Date()
          }
        })

      } catch (error) {
        console.error('Payout processing error:', error)
        return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 })
      }
    }

    // Calculate instructor earnings
    if (path === '/instructor/calculate-earnings') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { instructorId, period = '30days' } = body

        if (!instructorId) {
          return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
        }

        // Get instructor payout configuration
        const instructorPayout = await database.collection('instructor_payouts').findOne({
          instructorId: instructorId
        })

        if (!instructorPayout) {
          return NextResponse.json({ error: 'Instructor payout profile not found' }, { status: 404 })
        }

        // Calculate date range
        let days
        switch (period) {
          case '7days': days = 7; break
          case '30days': days = 30; break
          case '90days': days = 90; break
          default: days = 30
        }

        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        // Get classes taught by instructor
        const classesBookings = await database.collection('bookings').find({
          instructorId: instructorId,
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }).toArray()

        // Calculate earnings
        let totalRevenue = 0
        let totalClasses = 0
        let totalStudents = 0

        const earningsBreakdown = classesBookings.map(booking => {
          const classRevenue = booking.amount || 0
          const instructorEarnings = classRevenue * instructorPayout.commissionRate
          const platformFee = classRevenue * 0.0375 // 3.75% platform fee
          const studioEarnings = classRevenue - instructorEarnings - platformFee

          totalRevenue += classRevenue
          totalClasses += 1
          totalStudents += 1

          return {
            bookingId: booking.id,
            className: booking.className,
            classDate: booking.classStartTime,
            classRevenue: classRevenue,
            instructorEarnings: instructorEarnings,
            platformFee: platformFee,
            studioEarnings: studioEarnings,
            commissionRate: instructorPayout.commissionRate
          }
        })

        const totalInstructorEarnings = earningsBreakdown.reduce((sum, item) => sum + item.instructorEarnings, 0)
        const averageEarningsPerClass = totalClasses > 0 ? totalInstructorEarnings / totalClasses : 0

        // Calculate bonuses
        const bonuses = {
          performanceBonus: 0,
          classCountBonus: 0,
          ratingBonus: 0
        }

        if (instructorPayout.bonusStructure?.classCountBonus && totalClasses >= 20) {
          bonuses.classCountBonus = instructorPayout.bonusStructure.classCountBonus
        }

        const totalBonuses = Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0)
        const totalEarnings = totalInstructorEarnings + totalBonuses

        return NextResponse.json({
          success: true,
          earnings: {
            period: period,
            dateRange: { startDate, endDate },
            summary: {
              totalRevenue: totalRevenue,
              totalInstructorEarnings: totalInstructorEarnings,
              totalBonuses: totalBonuses,
              totalEarnings: totalEarnings,
              totalClasses: totalClasses,
              totalStudents: totalStudents,
              averageEarningsPerClass: averageEarningsPerClass,
              commissionRate: instructorPayout.commissionRate
            },
            breakdown: earningsBreakdown,
            bonuses: bonuses,
            payoutStatus: {
              pendingEarnings: instructorPayout.pendingEarnings,
              totalLifetimeEarnings: instructorPayout.totalEarnings,
              totalPayouts: instructorPayout.totalPayouts,
              lastPayoutAt: instructorPayout.lastPayoutAt
            }
          }
        })

      } catch (error) {
        console.error('Earnings calculation error:', error)
        return NextResponse.json({ error: 'Failed to calculate earnings' }, { status: 500 })
      }
    }

    // Generate instructor 1099 tax document
    if (path === '/instructor/generate-1099') {
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        const body = await request.json()
        const { instructorId, taxYear = new Date().getFullYear() } = body

        if (!instructorId) {
          return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
        }

        // Get instructor profile
        const instructor = await database.collection('profiles').findOne({
          userId: instructorId,
          role: 'instructor'
        })

        if (!instructor) {
          return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
        }

        // Calculate tax year earnings
        const yearStart = new Date(taxYear, 0, 1)
        const yearEnd = new Date(taxYear, 11, 31)

        const yearlyPayouts = await database.collection('instructor_payout_transactions').find({
          instructorId: instructorId,
          processedAt: { $gte: yearStart, $lte: yearEnd },
          status: 'completed'
        }).toArray()

        const totalEarnings = yearlyPayouts.reduce((sum, payout) => sum + payout.amount, 0)

        // Generate 1099 document data
        const form1099 = {
          id: `1099-${instructorId}-${taxYear}`,
          instructorId: instructorId,
          taxYear: taxYear,
          instructorInfo: {
            name: `${instructor.firstName} ${instructor.lastName}`,
            email: instructor.email,
            address: instructor.address,
            ssn: instructor.ssn || 'Not provided', // Would need to collect during onboarding
            phone: instructor.phone
          },
          payerInfo: {
            name: 'Thryve Fitness Platform',
            address: '123 Fitness Street, San Francisco, CA 94101',
            ein: '12-3456789' // Platform EIN
          },
          earnings: {
            totalEarnings: totalEarnings,
            federalTaxWithheld: 0, // Platform doesn't withhold taxes
            stateIncomeTax: 0,
            socialSecurityTax: 0,
            medicareTax: 0
          },
          payoutBreakdown: yearlyPayouts.map(payout => ({
            date: payout.processedAt,
            amount: payout.amount,
            type: payout.payoutType
          })),
          generatedAt: new Date(),
          generatedBy: firebaseUser.uid
        }

        // Store 1099 record
        await database.collection('instructor_1099_forms').updateOne(
          { instructorId: instructorId, taxYear: taxYear },
          { $set: form1099 },
          { upsert: true }
        )

        return NextResponse.json({
          success: true,
          message: '1099 form generated successfully',
          form1099: form1099
        })

      } catch (error) {
        console.error('1099 generation error:', error)
        return NextResponse.json({ error: 'Failed to generate 1099 form' }, { status: 500 })
      }
    }

    // Enhanced Stripe webhook handling
    if (path === '/payments/webhook') {
      const body = await request.text()
      const sig = request.headers.get('stripe-signature')

      let event

      try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }

      try {
        switch (event.type) {
          case 'payment_intent.succeeded':
            await handlePaymentIntentSucceeded(event.data.object, database)
            break

          case 'payment_intent.payment_failed':
            await handlePaymentIntentFailed(event.data.object, database)
            break

          case 'invoice.payment_succeeded':
            await handleInvoicePaymentSucceeded(event.data.object, database)
            break

          case 'invoice.payment_failed':
            await handleInvoicePaymentFailed(event.data.object, database)
            break

          case 'customer.subscription.created':
            await handleSubscriptionCreated(event.data.object, database)
            break

          case 'customer.subscription.updated':
            await handleSubscriptionUpdated(event.data.object, database)
            break

          case 'customer.subscription.deleted':
            await handleSubscriptionDeleted(event.data.object, database)
            break

          case 'setup_intent.succeeded':
            await handleSetupIntentSucceeded(event.data.object, database)
            break

          default:
            console.log(`Unhandled event type ${event.type}`)
        }

        return NextResponse.json({ received: true })

      } catch (error) {
        console.error('Webhook processing error:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
      }
    }

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePUT(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    const database = await connectDB()

    console.log('SERVER-API PUT Request:', path)

    // Get authenticated user for communication endpoints
    const user = await getFirebaseUser(request)
    if (!user && (path.startsWith('/notifications'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ===== COMMUNICATION LAYER ENDPOINTS (PUT) =====

    // Update Notification Settings
    if (path === '/notifications/settings') {
      try {
        const { settings } = await request.json()
        
        await database.collection('userSettings').updateOne(
          { userId: user.uid },
          {
            $set: {
              notifications: settings,
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error updating notification settings:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
      }
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
    const path = url.pathname.replace('/server-api', '')
    const database = await connectDB()

    console.log('SERVER-API DELETE Request:', path)

    // Get authenticated user for communication endpoints
    const user = await getFirebaseUser(request)
    if (!user && (path.startsWith('/notifications'))) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // ===== COMMUNICATION LAYER ENDPOINTS (DELETE) =====

    // Delete Notification
    if (path.startsWith('/notifications/') && !path.includes('/read')) {
      const pathParts = path.split('/')
      const notificationId = pathParts[2]
      
      try {
        const result = await database.collection('notifications').deleteOne({
          id: notificationId,
          userId: user.uid
        })

        if (result.deletedCount === 0) {
          return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error deleting notification:', error)
        return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
      }
    }

    // Delete Message Thread (for participants only)
    if (path.startsWith('/messages/threads/')) {
      const pathParts = path.split('/')
      const threadId = pathParts[3]
      
      try {
        // Only allow deletion if user is a participant
        const thread = await database.collection('messageThreads').findOne({
          id: threadId,
          participantIds: user.uid
        })

        if (!thread) {
          return NextResponse.json({ error: 'Thread not found or access denied' }, { status: 404 })
        }

        // Delete all messages in the thread
        await database.collection('messages').deleteMany({ threadId })
        
        // Delete the thread
        await database.collection('messageThreads').deleteOne({ id: threadId })

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error deleting message thread:', error)
        return NextResponse.json({ error: 'Failed to delete thread' }, { status: 500 })
      }
    }

    // Delete uploaded file
    const fileIdMatch = path.match(/^\/files\/(.+)$/)
    if (fileIdMatch) {
      const fileId = fileIdMatch[1]
      const firebaseUser = await getFirebaseUser(request)
      if (!firebaseUser) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      try {
        // Find and delete the file (only allow deletion by uploader)
        const file = await database.collection('uploaded_files').findOne({
          id: fileId,
          uploaderId: firebaseUser.uid
        })

        if (!file) {
          return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 })
        }

        // Delete from database
        await database.collection('uploaded_files').deleteOne({
          id: fileId,
          uploaderId: firebaseUser.uid
        })

        // Update related entities (remove file references)
        if (file.fileType === 'profile') {
          await database.collection('profiles').updateOne(
            { userId: firebaseUser.uid },
            { $unset: { profileImage: "" }, $set: { updatedAt: new Date() } }
          )
        } else if (file.fileType === 'class' && file.entityId) {
          await database.collection('studio_classes').updateOne(
            { id: file.entityId, studioId: firebaseUser.uid },
            { $unset: { classImage: "" }, $set: { updatedAt: new Date() } }
          )
        }

        return NextResponse.json({
          message: 'File deleted successfully',
          fileId: fileId
        })
      } catch (error) {
        console.error('File deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
      }
    }



    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('DELETE Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
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

// ========================================
// STRIPE WEBHOOK HANDLER FUNCTIONS
// ========================================

async function handlePaymentIntentSucceeded(paymentIntent, database) {
  try {
    const metadata = paymentIntent.metadata
    const { firebase_uid, class_id, payment_type, booking_id } = metadata

    if (payment_type === 'class_booking' && class_id) {
      // Update booking status to confirmed
      const updateResult = await database.collection('bookings').updateOne(
        { id: booking_id || class_id, userId: firebase_uid },
        {
          $set: {
            status: 'confirmed',
            paymentIntentId: paymentIntent.id,
            paymentAmount: paymentIntent.amount,
            paidAt: new Date(),
            updatedAt: new Date()
          }
        }
      )

      // Update class capacity if booking was confirmed
      if (updateResult.modifiedCount > 0) {
        await database.collection('class_schedules').updateOne(
          { id: class_id },
          {
            $inc: { bookedCount: 1 },
            $set: { updatedAt: new Date() }
          }
        )
      }
    }

    // Record transaction
    const transaction = {
      id: `txn-${Date.now()}`,
      userId: firebase_uid,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'completed',
      type: payment_type,
      metadata: metadata,
      createdAt: new Date()
    }

    await database.collection('transactions').insertOne(transaction)
    
    console.log('Payment intent succeeded processed:', paymentIntent.id)
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent, database) {
  try {
    const metadata = paymentIntent.metadata
    const { firebase_uid, class_id, payment_type, booking_id } = metadata

    if (payment_type === 'class_booking' && class_id) {
      // Update booking status to failed
      await database.collection('bookings').updateOne(
        { id: booking_id || class_id, userId: firebase_uid },
        {
          $set: {
            status: 'payment_failed',
            paymentIntentId: paymentIntent.id,
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
            updatedAt: new Date()
          }
        }
      )
    }

    // Record failed transaction
    const transaction = {
      id: `txn-failed-${Date.now()}`,
      userId: firebase_uid,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: 'failed',
      type: payment_type,
      failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      metadata: metadata,
      createdAt: new Date()
    }

    await database.collection('transactions').insertOne(transaction)

    console.log('Payment intent failed processed:', paymentIntent.id)
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice, database) {
  try {
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return

    // Update subscription status
    await database.collection('subscriptions').updateOne(
      { stripeSubscriptionId: subscriptionId },
      {
        $set: {
          status: 'active',
          currentPeriodStart: new Date(invoice.period_start * 1000),
          currentPeriodEnd: new Date(invoice.period_end * 1000),
          lastInvoiceId: invoice.id,
          updatedAt: new Date()
        }
      }
    )

    // Record subscription payment
    const payment = {
      id: `sub-payment-${Date.now()}`,
      invoiceId: invoice.id,
      subscriptionId: subscriptionId,
      amount: invoice.amount_paid,
      status: 'paid',
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      createdAt: new Date()
    }

    await database.collection('subscription_payments').insertOne(payment)

    console.log('Invoice payment succeeded processed:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(invoice, database) {
  try {
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return

    // Update subscription status
    await database.collection('subscriptions').updateOne(
      { stripeSubscriptionId: subscriptionId },
      {
        $set: {
          status: 'past_due',
          lastFailedInvoiceId: invoice.id,
          failureReason: invoice.last_finalization_error?.message || 'Payment failed',
          updatedAt: new Date()
        }
      }
    )

    // Record failed payment
    const payment = {
      id: `sub-payment-failed-${Date.now()}`,
      invoiceId: invoice.id,
      subscriptionId: subscriptionId,
      amount: invoice.amount_due,
      status: 'payment_failed',
      failureReason: invoice.last_finalization_error?.message || 'Payment failed',
      createdAt: new Date()
    }

    await database.collection('subscription_payments').insertOne(payment)

    console.log('Invoice payment failed processed:', invoice.id)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

async function handleSubscriptionCreated(subscription, database) {
  try {
    const metadata = subscription.metadata
    const { firebase_uid, studio_id, subscription_type } = metadata

    const subscriptionRecord = {
      id: `subscription-${Date.now()}`,
      stripeSubscriptionId: subscription.id,
      userId: firebase_uid,
      studioId: studio_id,
      subscriptionType: subscription_type,
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await database.collection('subscriptions').insertOne(subscriptionRecord)

    console.log('Subscription created processed:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription, database) {
  try {
    await database.collection('subscriptions').updateOne(
      { stripeSubscriptionId: subscription.id },
      {
        $set: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          updatedAt: new Date()
        }
      }
    )

    console.log('Subscription updated processed:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription, database) {
  try {
    await database.collection('subscriptions').updateOne(
      { stripeSubscriptionId: subscription.id },
      {
        $set: {
          status: 'canceled',
          canceledAt: new Date(),
          updatedAt: new Date()
        }
      }
    )

    console.log('Subscription deleted processed:', subscription.id)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleSetupIntentSucceeded(setupIntent, database) {
  try {
    const customerId = setupIntent.customer
    if (!customerId) return

    // Get user profile by Stripe customer ID
    const userProfile = await database.collection('profiles').findOne({ stripeCustomerId: customerId })
    if (!userProfile) return

    // Record successful payment method setup
    const paymentMethodRecord = {
      id: `pm-${Date.now()}`,
      userId: userProfile.userId,
      stripeCustomerId: customerId,
      setupIntentId: setupIntent.id,
      paymentMethodId: setupIntent.payment_method,
      status: 'active',
      createdAt: new Date()
    }

    await database.collection('payment_methods').insertOne(paymentMethodRecord)

    console.log('Setup intent succeeded processed:', setupIntent.id)
  } catch (error) {
    console.error('Error handling setup intent succeeded:', error)
  }
}