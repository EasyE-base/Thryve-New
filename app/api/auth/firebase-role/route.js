import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME || 'thryve_fitness')
}

export async function POST(request) {
  try {
    const { uid, email, role } = await request.json()

    if (!uid || !email || !role) {
      return NextResponse.json(
        { error: 'UID, email, and role are required' },
        { status: 400 }
      )
    }

    if (!['customer', 'instructor', 'merchant'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const db = await connectDB()
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

    console.log('🔥 Firebase user role updated:', { uid, email, role })

    return NextResponse.json({
      message: 'Role updated successfully',
      role,
      upserted: result.upsertedCount > 0
    })
  } catch (error) {
    console.error('❌ Firebase role update error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}