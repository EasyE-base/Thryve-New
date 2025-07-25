import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Simplified auth options without MongoDB adapter initially
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For now, let's create a simple test user to verify NextAuth works
        // Later we'll connect this to MongoDB
        if (credentials.email === 'test@example.com' && credentials.password === 'test123') {
          return {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: null,
            onboarding_complete: false
          }
        }

        return null
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
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-key',
  debug: process.env.NODE_ENV === 'development'
}