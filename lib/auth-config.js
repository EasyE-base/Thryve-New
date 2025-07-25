import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const client = new MongoClient(process.env.MONGO_URL)
const clientPromise = client.connect()

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const client = await clientPromise
        const users = client.db().collection('users')
        
        // Find user by email
        const user = await users.findOne({ email: credentials.email })
        
        if (!user) {
          throw new Error('No user found with this email')
        }

        // Check password
        const isValid = await bcrypt.compare(credentials.password, user.password)
        
        if (!isValid) {
          throw new Error('Invalid password')
        }

        // Return user object
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          onboarding_complete: user.onboarding_complete || false
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
      // Persist user data to token
      if (user) {
        token.role = user.role
        token.onboarding_complete = user.onboarding_complete
      }
      
      // Handle session updates (like role selection)
      if (trigger === 'update' && session) {
        if (session.role) {
          token.role = session.role
        }
        if (session.onboarding_complete !== undefined) {
          token.onboarding_complete = session.onboarding_complete
        }
      }
      
      return token
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
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here'
}