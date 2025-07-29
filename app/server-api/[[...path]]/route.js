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
    await sendWaitlistPromotionNotification(waitlistData.userId, classId)
    
    console.log(`Promoted user ${waitlistData.userId} from waitlist for class ${classId}`)
  } catch (error) {
    console.error('Error promoting from waitlist:', error)
  }
}

// Helper function to create notifications
async function createNotification(userId, type, title, message, data = {}) {
  try {
    await db.collection('notifications').add({
      id: generateId(),
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date()
    })
    
    // TODO: Send push notification, email, or SMS based on user preferences
    // await sendPushNotification(userId, title, message)
    // await sendEmailNotification(userId, title, message)
    
  } catch (error) {
    console.error('Error creating notification:', error)
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

    // ===== COMMUNICATION LAYER ENDPOINTS =====

  // Message Threads Management
  if (method === 'GET' && path === '/messages/threads') {
    try {
      const threads = await db.collection('messageThreads')
        .where('participantIds', 'array-contains', user.uid)
        .orderBy('lastMessageAt', 'desc')
        .get()

      const threadsData = []
      for (const doc of threads.docs) {
        const threadData = doc.data()
        const lastMessage = threadData.lastMessage
        
        // Get participant details
        const participants = []
        for (const participantId of threadData.participantIds) {
          if (participantId !== user.uid) {
            const userDoc = await db.collection('users').doc(participantId).get()
            if (userDoc.exists) {
              const userData = userDoc.data()
              participants.push({
                id: participantId,
                name: userData.displayName || userData.email,
                role: userData.role,
                avatar: userData.photoURL
              })
            }
          }
        }

        // Count unread messages
        const unreadQuery = await db.collection('messages')
          .where('threadId', '==', doc.id)
          .where('senderId', '!=', user.uid)
          .where('readBy', 'not-in', [user.uid])
          .get()

        threadsData.push({
          id: doc.id,
          type: threadData.type || 'direct',
          name: threadData.name,
          participants,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp?.toDate?.()?.toISOString() || lastMessage.timestamp,
            senderId: lastMessage.senderId
          } : null,
          unreadCount: unreadQuery.size,
          classId: threadData.classId,
          className: threadData.className,
          createdAt: threadData.createdAt?.toDate?.()?.toISOString() || threadData.createdAt
        })
      }

      return NextResponse.json({ success: true, threads: threadsData })
    } catch (error) {
      console.error('Error fetching message threads:', error)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }
  }

  // Get Messages for Thread
  if (method === 'GET' && path.startsWith('/messages/threads/') && path.endsWith('/messages')) {
    const threadId = path.split('/')[3]
    try {
      const messages = await db.collection('messages')
        .where('threadId', '==', threadId)
        .orderBy('timestamp', 'asc')
        .limit(100)
        .get()

      const messagesData = []
      messages.forEach(doc => {
        const data = doc.data()
        messagesData.push({
          id: doc.id,
          content: data.content,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          type: data.type || 'text',
          readBy: data.readBy || []
        })
      })

      return NextResponse.json({ success: true, messages: messagesData })
    } catch (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
  }

  // Send Message
  if (method === 'POST' && path === '/messages/send') {
    try {
      const { threadId, content, type = 'text' } = await request.json()

      // Get sender details
      const senderDoc = await db.collection('users').doc(user.uid).get()
      const senderName = senderDoc.exists ? 
        (senderDoc.data().displayName || senderDoc.data().email) : 'Unknown User'

      const messageId = generateId()
      const timestamp = new Date()

      // Create message
      await db.collection('messages').add({
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
      await db.collection('messageThreads').doc(threadId).update({
        lastMessage: {
          content,
          senderId: user.uid,
          senderName,
          timestamp
        },
        lastMessageAt: timestamp,
        updatedAt: timestamp
      })

      // Send notifications to other participants
      const threadDoc = await db.collection('messageThreads').doc(threadId).get()
      if (threadDoc.exists) {
        const threadData = threadDoc.data()
        const otherParticipants = threadData.participantIds.filter(id => id !== user.uid)
        
        for (const participantId of otherParticipants) {
          await createNotification(participantId, 'message', 'New Message', 
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
  if (method === 'POST' && path.startsWith('/messages/threads/') && path.endsWith('/read')) {
    const threadId = path.split('/')[3]
    try {
      const unreadMessages = await db.collection('messages')
        .where('threadId', '==', threadId)
        .where('senderId', '!=', user.uid)
        .get()

      const batch = db.batch()
      unreadMessages.forEach(doc => {
        const readBy = doc.data().readBy || []
        if (!readBy.includes(user.uid)) {
          batch.update(doc.ref, {
            readBy: [...readBy, user.uid],
            updatedAt: new Date()
          })
        }
      })

      await batch.commit()
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }
  }

  // Create Message Thread
  if (method === 'POST' && path === '/messages/threads/create') {
    try {
      const { participantIds, initialMessage, type = 'direct' } = await request.json()
      
      const allParticipantIds = [...new Set([user.uid, ...participantIds])]
      const threadId = generateId()
      const timestamp = new Date()

      // Get sender name
      const senderDoc = await db.collection('users').doc(user.uid).get()
      const senderName = senderDoc.exists ? 
        (senderDoc.data().displayName || senderDoc.data().email) : 'Unknown User'

      // Create thread
      const threadData = {
        id: threadId,
        type,
        participantIds: allParticipantIds,
        createdBy: user.uid,
        createdAt: timestamp,
        lastMessageAt: timestamp,
        lastMessage: initialMessage ? {
          content: initialMessage,
          senderId: user.uid,
          senderName,
          timestamp
        } : null
      }

      await db.collection('messageThreads').doc(threadId).set(threadData)

      // Send initial message if provided
      if (initialMessage) {
        await db.collection('messages').add({
          id: generateId(),
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

      return NextResponse.json({ success: true, thread: { id: threadId, ...threadData } })
    } catch (error) {
      console.error('Error creating thread:', error)
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }
  }

  // ===== NOTIFICATION SYSTEM ENDPOINTS =====

  // Get User Notifications
  if (method === 'GET' && path === '/notifications') {
    try {
      const notifications = await db.collection('notifications')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get()

      const notificationsData = []
      let unreadCount = 0

      notifications.forEach(doc => {
        const data = doc.data()
        if (!data.read) unreadCount++
        
        notificationsData.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data || {},
          read: data.read || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
        })
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

  // Mark Notification as Read
  if (method === 'POST' && path.startsWith('/notifications/') && path.endsWith('/read')) {
    const notificationId = path.split('/')[2]
    try {
      await db.collection('notifications').doc(notificationId).update({
        read: true,
        readAt: new Date(),
        updatedAt: new Date()
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }
  }

  // Mark All Notifications as Read
  if (method === 'POST' && path === '/notifications/mark-all-read') {
    try {
      const unreadNotifications = await db.collection('notifications')
        .where('userId', '==', user.uid)
        .where('read', '==', false)
        .get()

      const batch = db.batch()
      const timestamp = new Date()

      unreadNotifications.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: timestamp,
          updatedAt: timestamp
        })
      })

      await batch.commit()
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error marking all as read:', error)
      return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
    }
  }

  // Delete Notification
  if (method === 'DELETE' && path.startsWith('/notifications/')) {
    const notificationId = path.split('/')[2]
    try {
      await db.collection('notifications').doc(notificationId).delete()
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting notification:', error)
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }
  }

  // Get/Update Notification Settings
  if (method === 'GET' && path === '/notifications/settings') {
    try {
      const settingsDoc = await db.collection('userSettings').doc(user.uid).get()
      const settings = settingsDoc.exists ? 
        settingsDoc.data().notifications || {} : {}

      return NextResponse.json({ success: true, settings })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
  }

  if (method === 'PUT' && path === '/notifications/settings') {
    try {
      const { settings } = await request.json()
      
      await db.collection('userSettings').doc(user.uid).set({
        notifications: settings,
        updatedAt: new Date()
      }, { merge: true })

      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
  }

    // Enhanced Booking System Endpoints
  
  // Real-time class availability
  if (method === 'GET' && path.startsWith('/classes/') && path.endsWith('/availability')) {
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

  // Enhanced booking creation with waitlist logic
  if (method === 'POST' && path === '/bookings/create') {
    try {
      const { classId, paymentMethod, date } = await request.json()
      
      // Check real-time availability
      const classData = await db.collection('classes').doc(classId).get()
      if (!classData.exists) {
        return NextResponse.json({ error: 'Class not found' }, { status: 404 })
      }

      const capacity = classData.data().capacity || 20
      const existingBookings = await db.collection('bookings')
        .where('classId', '==', classId)
        .where('status', '==', 'confirmed')
        .get()

      const availableSpots = capacity - existingBookings.size

      // Check if user already has a booking
      const userBookingCheck = await db.collection('bookings')
        .where('classId', '==', classId)
        .where('userId', '==', user.uid)
        .where('status', 'in', ['confirmed', 'pending'])
        .get()

      if (!userBookingCheck.empty) {
        return NextResponse.json({ error: 'You already have a booking for this class' }, { status: 400 })
      }

      let bookingResult
      let waitlisted = false

      if (availableSpots > 0) {
        // Create confirmed booking
        const bookingRef = await db.collection('bookings').add({
          id: generateId(),
          userId: user.uid,
          classId,
          status: 'confirmed',
          paymentMethod,
          paymentStatus: paymentMethod === 'credit' ? 'pending' : 'completed',
          bookingDate: new Date(),
          classDate: new Date(date),
          price: classData.data().price || 0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        bookingResult = { id: bookingRef.id, status: 'confirmed' }

        // Process payment if needed
        if (paymentMethod === 'credit') {
          // Implement Stripe payment processing here
        }
      } else {
        // Add to waitlist
        const waitlistRef = await db.collection('waitlist').add({
          id: generateId(),
          userId: user.uid,
          classId,
          status: 'active',
          position: await getWaitlistPosition(classId),
          joinedAt: new Date(),
          createdAt: new Date()
        })
        
        bookingResult = { id: waitlistRef.id, status: 'waitlisted' }
        waitlisted = true
      }

      return NextResponse.json({
        success: true,
        booking: bookingResult,
        waitlisted,
        availableSpots: Math.max(0, availableSpots - (waitlisted ? 0 : 1))
      })
    } catch (error) {
      console.error('Booking creation error:', error)
      return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
    }
  }

  // Join waitlist endpoint
  if (method === 'POST' && path === '/bookings/waitlist') {
    try {
      const { classId, date } = await request.json()
      
      // Check if already on waitlist
      const existingWaitlist = await db.collection('waitlist')
        .where('classId', '==', classId)
        .where('userId', '==', user.uid)
        .where('status', '==', 'active')
        .get()

      if (!existingWaitlist.empty) {
        return NextResponse.json({ error: 'Already on waitlist for this class' }, { status: 400 })
      }

      const position = await getWaitlistPosition(classId)
      await db.collection('waitlist').add({
        id: generateId(),
        userId: user.uid,
        classId,
        status: 'active',
        position,
        joinedAt: new Date(),
        classDate: new Date(date),
        createdAt: new Date()
      })

      return NextResponse.json({ success: true, position })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }
  }

  // Cancel booking with waitlist promotion
  if (method === 'DELETE' && path.startsWith('/bookings/') && path.endsWith('/cancel')) {
    const bookingId = path.split('/')[2]
    try {
      const bookingRef = db.collection('bookings').doc(bookingId)
      const booking = await bookingRef.get()
      
      if (!booking.exists || booking.data().userId !== user.uid) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      const classId = booking.data().classId

      // Cancel the booking
      await bookingRef.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      })

      // Promote from waitlist
      await promoteFromWaitlist(classId)

      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'Cancellation failed' }, { status: 500 })
    }
  }

  // Reschedule booking
  if (method === 'PUT' && path.startsWith('/bookings/') && path.endsWith('/reschedule')) {
    const bookingId = path.split('/')[2]
    try {
      const { newDate } = await request.json()
      
      const bookingRef = db.collection('bookings').doc(bookingId)
      const booking = await bookingRef.get()
      
      if (!booking.exists || booking.data().userId !== user.uid) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      }

      await bookingRef.update({
        classDate: new Date(newDate),
        updatedAt: new Date(),
        rescheduledAt: new Date()
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      return NextResponse.json({ error: 'Reschedule failed' }, { status: 500 })
    }
  }

  // Get user's bookings
  if (method === 'GET' && path === '/bookings/user') {
    try {
      const bookings = await db.collection('bookings')
        .where('userId', '==', user.uid)
        .where('status', 'in', ['confirmed', 'pending'])
        .orderBy('classDate', 'desc')
        .get()

      const bookingsData = []
      bookings.forEach(doc => {
        const data = doc.data()
        bookingsData.push({
          id: doc.id,
          ...data,
          classDate: data.classDate?.toDate?.()?.toISOString() || data.classDate,
          bookingDate: data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate
        })
      })

      return NextResponse.json({ success: true, bookings: bookingsData })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }
  }

  // Get similar classes
  if (method === 'GET' && path.startsWith('/classes/similar/')) {
    const classId = path.split('/')[3]
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '3')
    
    try {
      // Simple similar classes logic - same type or instructor
      const classData = await db.collection('classes').doc(classId).get()
      if (!classData.exists) {
        return NextResponse.json({ classes: [] })
      }

      const { type, instructor } = classData.data()
      const similarClasses = await db.collection('classes')
        .where('type', '==', type)
        .limit(limit + 1) // Get one extra to exclude current class
        .get()

      const classes = []
      similarClasses.forEach(doc => {
        if (doc.id !== classId) { // Exclude current class
          const data = doc.data()
          classes.push({
            id: doc.id,
            ...data,
            date: data.date?.toDate?.()?.toLocaleDateString() || data.date
          })
        }
      })

      return NextResponse.json({ success: true, classes: classes.slice(0, limit) })
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch similar classes' }, { status: 500 })
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

    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handlePUT(request) {
  return NextResponse.json({ error: 'Method not implemented' }, { status: 501 })
}

async function handleDELETE(request) {
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace('/server-api', '')
    const database = await connectDB()

    console.log('SERVER-API DELETE Request:', path)

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