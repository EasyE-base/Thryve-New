import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAFD00k_NE4-TPGvjEA8xqsOC-cflij9gg",
  authDomain: "thryve-fitness.firebaseapp.com",
  databaseURL: "https://thryve-fitness-default-rtdb.firebaseio.com",
  projectId: "thryve-fitness",
  storageBucket: "thryve-fitness.firebasestorage.app",
  messagingSenderId: "755685025812",
  appId: "1:755685025812:web:b629d10b559371efd55f01"
}

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// FIX: Set persistence immediately after auth initialization
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence error:", error);
});

export default app