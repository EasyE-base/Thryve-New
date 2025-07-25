import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME || 'thryve_fitness')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const users = db.collection('firebase_users')

    const user = await users.findOne({ uid })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      role: user.role,
      onboarding_complete: user.onboarding_complete || false
    })
  } catch (error) {
    console.error('❌ Firebase get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}