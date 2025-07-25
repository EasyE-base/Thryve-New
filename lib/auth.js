import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

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

export async function signUp(email, password, firstName = '', lastName = '') {
  try {
    console.log('=== NEXTAUTH SIGNUP ===')
    
    const database = await connectDB()
    const users = database.collection('users')
    
    // Check if user already exists
    const existingUser = await users.findOne({ email })
    if (existingUser) {
      throw new Error('User already exists with this email')
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create user
    const newUser = {
      email,
      password: hashedPassword,
      name: firstName ? `${firstName} ${lastName}`.trim() : email.split('@')[0],
      firstName,
      lastName,
      role: null, // Will be set during role selection
      onboarding_complete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await users.insertOne(newUser)
    console.log('User created with ID:', result.insertedId)
    
    return {
      id: result.insertedId.toString(),
      email: newUser.email,
      name: newUser.name
    }
  } catch (error) {
    console.error('Signup error:', error)
    throw error
  }
}

export async function updateUserRole(userId, role) {
  try {
    console.log('=== UPDATING USER ROLE ===', { userId, role })
    
    const database = await connectDB()
    const users = database.collection('users')
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          role,
          onboarding_complete: false,
          updatedAt: new Date()
        }
      }
    )
    
    console.log('Role update result:', result)
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Role update error:', error)
    throw error
  }
}

export async function completeOnboarding(userId, profileData) {
  try {
    console.log('=== COMPLETING ONBOARDING ===', { userId })
    
    const database = await connectDB()
    const users = database.collection('users')
    
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          onboarding_complete: true,
          profile: profileData,
          updatedAt: new Date()
        }
      }
    )
    
    console.log('Onboarding completion result:', result)
    return result.modifiedCount > 0
  } catch (error) {
    console.error('Onboarding completion error:', error)
    throw error
  }
}