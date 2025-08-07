import dotenv from 'dotenv'
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously } from 'firebase/auth'

// Load environment variables
dotenv.config()

console.log('🔍 Debugging Firebase Configuration...\n')

// Test different project configurations
const testConfigs = [
  {
    name: 'Current Config (thryve-fitness)',
    config: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }
  },
  {
    name: 'Alternative Config (thryve)',
    config: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: 'thryve.firebaseapp.com',
      projectId: 'thryve',
      storageBucket: 'thryve.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }
  }
]

async function testFirebaseConfig(configName, firebaseConfig) {
  console.log(`\n🧪 Testing: ${configName}`)
  console.log('Config:', {
    apiKey: firebaseConfig.apiKey ? 'SET' : 'MISSING',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'MISSING',
    appId: firebaseConfig.appId ? 'SET' : 'MISSING'
  })

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    
    console.log('✅ Firebase initialized successfully')
    
    // Test authentication
    console.log('🔐 Testing authentication...')
    const userCredential = await signInAnonymously(auth)
    console.log('✅ Authentication successful:', userCredential.user.uid)
    
    return true
  } catch (error) {
    console.log('❌ Error:', error.message)
    console.log('Error code:', error.code)
    return false
  }
}

async function runTests() {
  console.log('Current Environment Variables:')
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'MISSING')
  console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
  
  for (const testConfig of testConfigs) {
    const success = await testFirebaseConfig(testConfig.name, testConfig.config)
    if (success) {
      console.log(`\n🎉 SUCCESS: ${testConfig.name} works!`)
      break
    }
  }
  
  console.log('\n💡 Next Steps:')
  console.log('1. Go to https://console.firebase.google.com/')
  console.log('2. Check if you have a project named "thryve" or "thryve-fitness"')
  console.log('3. Go to Project Settings > General > Your apps')
  console.log('4. Look for a web app or create one')
  console.log('5. Copy the real config values')
}

runTests() 