// lib/firebaseClient.js
import app from '@/lib/firebase'
import { getAuth } from 'firebase/auth'

export const auth = getAuth(app)


