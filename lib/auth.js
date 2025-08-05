import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  onSnapshot 
} from 'firebase/firestore'
import { auth, firestore, googleProvider } from './firebase'

// Auth state persistence is handled in firebase.js

/**
 * Sign up a new user with email and password
 */
export const signUpWithEmailAndPassword = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update the user's display name
    if (displayName) {
      await updateProfile(user, { displayName })
    }
    
    return { success: true, user }
  } catch (error) {
    console.error('Sign up error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign in existing user with email and password
 */
export const signInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: userCredential.user }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign in with Google popup
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    
    console.log('✅ Google login:', user.uid)
    
    // Check if this is a new user or existing user
    const profileResult = await getUserProfile(user.uid)
    
    if (!profileResult.success) {
      // New user - initialize profile
      await initializeUserProfile(user)
    }
    
    return { success: true, user, isNewUser: !profileResult.success }
  } catch (error) {
    console.error('Google sign in error:', error)
    
    // Handle account-exists-with-different-credential error
    if (error.code === 'auth/account-exists-with-different-credential') {
      return { 
        success: false, 
        error: 'Account exists with different credential',
        code: 'account-exists',
        email: error.customData?.email,
        credential: error.credential
      }
    }
    
    return { success: false, error: error.message, code: error.code }
  }
}

/**
 * Link Google account to existing email/password account
 */
export const linkGoogleAccount = async (credential) => {
  try {
    if (!auth.currentUser) {
      return { success: false, error: 'No current user to link' }
    }
    
    const result = await linkWithCredential(auth.currentUser, credential)
    return { success: true, user: result.user }
  } catch (error) {
    console.error('Account linking error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error('Password reset error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Create user profile document in Firestore
 */
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(firestore, 'users', uid)
    await setDoc(userRef, {
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || null,
      profileCompleted: userData.profileCompleted || false,
      credits: userData.credits || 0,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      ...userData
    })
    return { success: true }
  } catch (error) {
    console.error('Create profile error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(firestore, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      return { success: true, profile: { uid, ...userSnap.data() } }
    } else {
      return { success: false, error: 'User profile not found' }
    }
  } catch (error) {
    console.error('Get profile error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(firestore, 'users', uid)
    await updateDoc(userRef, {
      ...updates,
      lastSeen: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Update profile error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

/**
 * Listen to user profile changes in real-time
 */
export const onUserProfileChange = (uid, callback) => {
  if (!uid) return () => {}
  
  const userRef = doc(firestore, 'users', uid)
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ uid, ...doc.data() })
    } else {
      callback(null)
    }
  }, (error) => {
    console.error('Profile snapshot error:', error)
    callback(null)
  })
}

/**
 * Initialize user profile for new signup
 */
export const initializeUserProfile = async (user) => {
  try {
    // Check if profile already exists
    const profileResult = await getUserProfile(user.uid)
    
    if (!profileResult.success) {
      // Create new profile
      await createUserProfile(user.uid, {
        email: user.email,
        name: user.displayName || '',
        role: null,
        profileCompleted: false,
        credits: 0
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Initialize profile error:', error)
    return { success: false, error: error.message }
  }
}