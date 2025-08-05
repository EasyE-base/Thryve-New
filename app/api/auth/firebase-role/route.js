import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function POST(request) {
  let client = null
  
  try {
    console.log('🔥 Firebase role API called')
    
    // Parse request body
    let requestData
    try {
      requestData = await request.json()
      console.log('🔥 Request data:', requestData)
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { uid, email, role } = requestData

    // Validate required fields
    if (!uid || !email || !role) {
      console.error('❌ Missing required fields:', { uid: !!uid, email: !!email, role: !!role })
      return NextResponse.json(
        { error: 'UID, email, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['customer', 'instructor', 'merchant'].includes(role)) {
      console.error('❌ Invalid role:', role)
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    console.log('🔥 Connecting to MongoDB...')
    
    // Connect to MongoDB
    try {
      client = new MongoClient(process.env.MONGO_URL)
      await client.connect()
      const db = client.db(process.env.DB_NAME || 'thryve_fitness')
      console.log('🔥 MongoDB connected successfully')

      const users = db.collection('firebase_users')

      // Upsert user with role
      const result = await users.updateOne(
        { uid },
        { 
          $set: { 
            uid,
            email,
            role,
            onboarding_complete: false,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      )

      console.log('🔥 Firebase user role updated:', { uid, email, role, result: result.modifiedCount || result.upsertedCount })

      return NextResponse.json({
        message: 'Role updated successfully',
        role,
        upserted: result.upsertedCount > 0
      })
      
    } catch (dbError) {
      console.error('❌ MongoDB error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 502 }
      )
    }
    
  } catch (error) {
    console.error('❌ Firebase role update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Always close MongoDB connection
    if (client) {
      try {
        await client.close()
        console.log('🔥 MongoDB connection closed')
      } catch (closeError) {
        console.error('❌ Error closing MongoDB connection:', closeError)
      }
    }
  }
}