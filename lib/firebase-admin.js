import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// This prevents us from initializing the app multiple times
const apps = getApps()

if (!apps.length) {
  try {
    // Try to parse the service account from environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : {
          project_id: process.env.FIREBASE_PROJECT_ID,
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        }
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    })
    console.log("Firebase Admin SDK initialized successfully.")
  } catch (error) {
    console.error("Firebase Admin initialization error:", error.message)
    // We don't throw here to allow the build to potentially continue on client-side only parts
  }
}

// Export the initialized services
const adminAuth = getAuth()
const adminDb = getFirestore()

export { adminAuth, adminDb }

// Utility function to verify Firebase ID token
export async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const token = authHeader.split('Bearer ')[1]
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Token verification error:', error)
    throw new Error('Invalid token')
  }
}

// Utility function to get user from request
export async function getFirebaseUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  try {
    const decodedToken = await verifyFirebaseToken(authHeader)
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken.custom_claims || {}
    }
  } catch (error) {
    console.error('Error getting Firebase user:', error)
    return null
  }
} 