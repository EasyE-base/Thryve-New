import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request) {
  let client = null
  
  try {
    console.log('🔥 Firebase get user API called')
    
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      console.error('❌ Missing UID parameter')
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      )
    }

    console.log('🔥 Connecting to MongoDB...')
    
    try {
      client = new MongoClient(process.env.MONGO_URL)
      await client.connect()
      const db = client.db(process.env.DB_NAME || 'thryve_fitness')
      console.log('🔥 MongoDB connected successfully')

      const users = db.collection('firebase_users')
      const user = await users.findOne({ uid })

      if (!user) {
        console.log('🔥 User not found for UID:', uid)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      console.log('🔥 User found:', { uid: user.uid, role: user.role, onboarding: user.onboarding_complete })

      return NextResponse.json({
        uid: user.uid,
        email: user.email,
        role: user.role,
        onboard_complete: user.onboarding_complete || false
      })
      
    } catch (dbError) {
      console.error('❌ MongoDB error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 502 }
      )
    }
    
  } catch (error) {
    console.error('❌ Firebase get user error:', error)
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