import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'

async function connectDB() {
  const client = new MongoClient(process.env.MONGO_URL)
  await client.connect()
  return client.db(process.env.DB_NAME || 'thryve_fitness')
}

export async function POST(request) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
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
    const users = db.collection('users')

    // Update user with selected role
    const result = await users.updateOne(
      { email },
      { 
        $set: { 
          role,
          onboarding_complete: false,
          updatedAt: new Date()
        }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('Simple auth: Role updated', { email, role })

    return NextResponse.json({
      message: 'Role updated successfully',
      role
    })
  } catch (error) {
    console.error('Simple role selection error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}