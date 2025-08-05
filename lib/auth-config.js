import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { MongoClient, ObjectId } from 'mongodb'

// MongoDB connection
let client
let db

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGO_URL, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 5000,
      })
      await client.connect()
      db = client.db(process.env.DB_NAME || 'thryve_fitness')
      console.log('MongoDB connected successfully')
    }
    return db
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw new Error('Database connection failed')
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        action: { label: 'Action', type: 'hidden' } // signin or signup
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          console.log('NextAuth authorize called:', { email: credentials.email, action: credentials.action })
          
          const database = await connectDB()
          const users = database.collection('users')
          
          // Check if this is a signup or signin action
          if (credentials.action === 'signup') {
            // Check if user already exists
            const existingUser = await users.findOne({ email: credentials.email })
            if (existingUser) {
              console.log('User already exists:', credentials.email)
              throw new Error('User already exists with this email')
            }

            // Hash password and create new user
            const hashedPassword = await bcrypt.hash(credentials.password, 12)
            const newUser = {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.email.split('@')[0],
              role: null,
              onboarding_complete: false,
              createdAt: new Date(),
              updatedAt: new Date()
            }

            const result = await users.insertOne(newUser)
            console.log('New user created:', result.insertedId)

            return {
              id: result.insertedId.toString(),
              email: newUser.email,
              name: newUser.name,
              role: null,
              onboarding_complete: false
            }
          } else {
            // Regular signin - find existing user
            const user = await users.findOne({ email: credentials.email })
            if (!user) {
              console.log('No user found:', credentials.email)
              throw new Error('No user found with this email')
            }

            // Check password
            const isValid = await bcrypt.compare(credentials.password, user.password)
            if (!isValid) {
              console.log('Invalid password for:', credentials.email)
              throw new Error('Invalid password')
            }

            console.log('User signed in:', user.email)

            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
              onboarding_complete: user.onboarding_complete || false
            }
          }
        } catch (error) {
          console.error('NextAuth authorize error:', error.message)
          
          // Return null instead of throwing to prevent NextAuth from breaking
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        // Persist user data to token
        if (user) {
          token.role = user.role
          token.onboarding_complete = user.onboarding_complete
        }
        
        // Handle session updates (like role selection)
        if (trigger === 'update' && session) {
          if (session.role) {
            token.role = session.role
            
            // Also update the role in MongoDB
            try {
              const database = await connectDB()
              const users = database.collection('users')
              await users.updateOne(
                { _id: new ObjectId(token.sub) },
                { 
                  $set: { 
                    role: session.role,
                    onboarding_complete: session.onboarding_complete || false,
                    updatedAt: new Date()
                  }
                }
              )
              console.log('Role updated in MongoDB:', session.role)
            } catch (error) {
              console.error('Failed to update role in MongoDB:', error.message)
              // Don't fail the JWT update if MongoDB fails
            }
          }
          if (session.onboarding_complete !== undefined) {
            token.onboarding_complete = session.onboarding_complete
          }
        }
        
        return token
      } catch (error) {
        console.error('JWT callback error:', error.message)
        return token // Return token even if there's an error
      }
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.onboarding_complete = token.onboarding_complete
      }
      return session
    }
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key',
  debug: process.env.NODE_ENV === 'development'
}