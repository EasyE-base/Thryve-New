import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()

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