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

    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12)
    const newUser = {
      email,
      password: hashedPassword,
      name: email.split('@')[0],
      role: null,
      onboarding_complete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await users.insertOne(newUser)
    console.log('Simple auth: User created', result.insertedId)

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.insertedId.toString(),
        email: newUser.email,
        name: newUser.name,
        role: null,
        onboarding_complete: false
      }
    })
  } catch (error) {
    console.error('Simple signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}