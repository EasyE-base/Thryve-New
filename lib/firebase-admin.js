import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

let adminApp = null
let adminDb = null
let adminAuth = null

export function initAdmin() {
  if (adminApp) return { db: adminDb, auth: adminAuth }

  try {
    // Check if app already exists
    if (getApps().length > 0) {
      adminApp = getApps()[0]
    } else {
      // Try multiple environment variable formats
      let serviceAccount = null
      
      // Try Base64 encoded key first (for Vercel)
      const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
      if (base64Key) {
        try {
          serviceAccount = JSON.parse(Buffer.from(base64Key, 'base64').toString('utf-8'))
          console.log('✅ Using Base64 encoded service account')
        } catch (error) {
          console.error('Failed to decode Base64 service account:', error.message)
        }
      }
      
      // Fallback to regular JSON key
      if (!serviceAccount) {
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
                                 process.env.FIREBASE_ADMIN_KEY || 
                                 process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        
        if (!serviceAccountKey) {
          throw new Error('Firebase service account key not found in environment variables')
        }

        try {
          serviceAccount = JSON.parse(serviceAccountKey)
          console.log('✅ Using JSON service account')
        } catch (parseError) {
          console.error('Failed to parse service account JSON:', parseError.message)
          throw new Error('Invalid service account JSON format')
        }
      }
      
      // Validate required fields
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account: missing required fields (project_id, private_key, client_email)')
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      })
    }

    adminDb = getFirestore(adminApp)
    adminAuth = getAuth(adminApp)
    
    console.log('✅ Firebase Admin initialized successfully')
    return { db: adminDb, auth: adminAuth }
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message)
    throw error
  }
}

// Initialize immediately
const { db, auth } = initAdmin()

export { db as adminDb, auth as adminAuth }

// Utility function to verify Firebase ID token
export async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid authorization header')
  }

  const token = authHeader.split('Bearer ')[1]
  
  try {
    const decodedToken = await auth.verifyIdToken(token)
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