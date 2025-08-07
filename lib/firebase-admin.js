// lib/firebase-admin.js
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let adminApp = null;
let adminDb = null;
let adminAuth = null;

function initAdmin() {
  // This function should only run once.
  if (adminApp) {
    return { db: adminDb, auth: adminAuth };
  }

  try {
    // Prevent re-initialization in serverless environments
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      let serviceAccount;
      const base64Key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
      const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

      if (base64Key) {
        // Preferred method: Decode from Base64
        console.log("Attempting to initialize Firebase Admin with Base64 key...");
        const serviceAccountJson = Buffer.from(base64Key, 'base64').toString('utf-8');
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (rawKey) {
        // Fallback method for raw JSON string (less recommended)
        console.log("Attempting to initialize Firebase Admin with raw JSON key...");
        serviceAccount = JSON.parse(rawKey);
      } else {
        throw new Error('Neither FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 nor FIREBASE_SERVICE_ACCOUNT_KEY environment variables are set.');
      }

      // Validate the parsed/decoded service account
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Invalid service account: missing required fields (project_id, private_key, client_email).');
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    adminDb = getFirestore(adminApp);
    adminAuth = getAuth(adminApp);

    console.log('✅ Firebase Admin initialized successfully.');
    return { db: adminDb, auth: adminAuth };

  } catch (error) {
    // Provide a more detailed error message for debugging
    console.error('❌ Firebase Admin initialization failed. Error:', error.message);
    if (error instanceof SyntaxError) {
      console.error("This is a JSON parsing error. If you are using a Base64 key, ensure the variable is named FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. If you are using a raw JSON string, ensure it's correctly formatted and escaped.");
    }
    // Re-throw to fail the build, which is the correct behavior
    throw error;
  }
}

// Initialize immediately and export the services
const { db, auth } = initAdmin();

export { db as adminDb, auth as adminAuth };

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