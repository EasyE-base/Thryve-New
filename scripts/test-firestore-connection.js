import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Load environment variables
dotenv.config()

// Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
  authDomain: firebaseConfig.authDomain ? 'SET' : 'MISSING',
  projectId: firebaseConfig.projectId ? 'SET' : 'MISSING',
  storageBucket: firebaseConfig.storageBucket ? 'SET' : 'MISSING',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
  appId: firebaseConfig.appId ? 'SET' : 'MISSING'
})

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

async function testConnection() {
  try {
    console.log('🔍 Testing Firestore connection...')
    
    // First, authenticate anonymously
    console.log('🔐 Authenticating...')
    const userCredential = await signInAnonymously(auth)
    console.log('✅ Authentication successful:', userCredential.user.uid)
    
    // Test reading from users collection (allowed by rules)
    console.log('📖 Testing read access...')
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    
    console.log('✅ Firestore connection successful!')
    console.log(`Found ${snapshot.size} documents in users collection`)
    
    // Test writing to users collection (allowed for own user)
    console.log('✍️ Testing write access...')
    const testUserData = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'test',
      createdAt: new Date()
    }
    
    const userDocRef = await addDoc(collection(db, 'users'), testUserData)
    console.log('✅ Write access successful! Document ID:', userDocRef.id)
    
  } catch (error) {
    console.error('❌ Firestore connection failed:', error.message)
    console.error('Error code:', error.code)
  }
}

testConnection() 