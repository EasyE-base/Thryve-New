import { adminDb, adminAuth } from '@/lib/firebase-admin'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const decodedToken = await adminAuth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Parse request body
    const classData = await request.json()

    // Validate required fields
    const requiredFields = ['className', 'classType', 'startDate', 'startTime']
    for (const field of requiredFields) {
      if (!classData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create class document
    const newClass = {
      ...classData,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      bookings: [],
      waitlist: [],
      studioId: userId, // Assuming the creator is the studio owner
      instructorId: classData.instructorId || null,
      maxStudents: classData.maxStudents || 20,
      currentStudents: 0,
      price: classData.price || 25.00,
      memberPrice: classData.memberPrice || 20.00,
      dropInPrice: classData.dropInPrice || 30.00,
      skillLevel: classData.skillLevel || 'all-levels',
      classIntensity: classData.classIntensity || 'moderate',
      equipmentRequired: classData.equipmentRequired || [],
      waitlistEnabled: classData.waitlistEnabled !== false,
      autoConfirm: classData.autoConfirm !== false,
      isPublic: classData.isPublic !== false,
      isFeatured: classData.isFeatured || false,
      virtualOption: classData.virtualOption || false,
      hybridClass: classData.hybridClass || false,
      zoomLink: classData.zoomLink || '',
      advanceBookingHours: classData.advanceBookingHours || 24,
      cancellationHours: classData.cancellationHours || 12,
      classNotes: classData.classNotes || '',
      tags: classData.tags || [],
      promotionalText: classData.promotionalText || ''
    }

    // Save to Firestore
    const classRef = await adminDb.collection('classes').add(newClass)

    // Create recurring instances if needed
    if (classData.recurring && classData.endDate) {
      await createRecurringInstances(classRef.id, newClass)
    }

    // Send notification to assigned instructor if specified
    if (classData.instructorId) {
      await sendInstructorNotification(classData.instructorId, newClass)
    }

    return NextResponse.json({
      success: true,
      classId: classRef.id,
      message: 'Class created successfully'
    })

  } catch (error) {
    console.error('Create class error:', error)
    return NextResponse.json({
      error: 'Failed to create class',
      details: error.message
    }, { status: 500 })
  }
}

// Helper function for recurring classes
async function createRecurringInstances(classId, classData) {
  const instances = []
  const startDate = new Date(classData.startDate)
  const endDate = new Date(classData.endDate)
  
  // Generate instances based on recurrence pattern
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (shouldCreateInstance(currentDate, classData.recurrencePattern)) {
      instances.push({
        parentClassId: classId,
        date: currentDate.toISOString().split('T')[0],
        startTime: classData.startTime,
        duration: classData.duration,
        status: 'scheduled',
        bookings: [],
        waitlist: [],
        maxStudents: classData.maxStudents,
        currentStudents: 0
      })
    }
    
    // Move to next date based on frequency
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  // Batch write instances
  const batch = adminDb.batch()
  instances.forEach(instance => {
    const instanceRef = adminDb.collection('class-instances').doc()
    batch.set(instanceRef, instance)
  })
  
  await batch.commit()
}

function shouldCreateInstance(date, pattern) {
  if (!pattern || !pattern.daysOfWeek) return true
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[date.getDay()]
  return pattern.daysOfWeek.includes(dayName)
}

async function sendInstructorNotification(instructorId, classData) {
  try {
    // Add notification to instructor
    await adminDb.collection('notifications').add({
      recipientId: instructorId,
      type: 'class_assigned',
      title: 'New Class Assignment',
      message: `You have been assigned to teach "${classData.className}"`,
      classId: classData.id,
      createdAt: new Date().toISOString(),
      read: false
    })
  } catch (error) {
    console.error('Failed to send instructor notification:', error)
  }
}
