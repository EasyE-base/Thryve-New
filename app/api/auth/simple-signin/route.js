import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME || 'thryve_fitness')
}

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const users = db.collection('users')

    // Find user by email
    const user = await users.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this email' },
        { status: 400 }
      )
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 400 }
      )
    }

    console.log('Simple auth: User signed in', user.email)

    return NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        onboarding_complete: user.onboarding_complete || false
      }
    })
  } catch (error) {
    console.error('Simple signin error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
}