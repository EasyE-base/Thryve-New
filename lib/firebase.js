import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAFD00k_NE4-TPGvjEA8xqsOC-cflij9gg",
  authDomain: "thryve-fitness.firebaseapp.com",
  projectId: "thryve-fitness",
  storageBucket: "thryve-fitness.firebasestorage.app",
  messagingSenderId: "755685025812",
  appId: "1:755685025812:web:b629d10b559371efd55f01"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export default app