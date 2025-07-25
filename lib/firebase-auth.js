import { auth } from './firebase'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth'

// Sign up with email and password
export const signUp = async (email, password, firstName = '', lastName = '') => {
  try {
    console.log('🔥 Firebase signup:', email)
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Update the user's display name
    if (firstName || lastName) {
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`.trim() || email.split('@')[0]
      })
    }
    
    console.log('✅ Firebase user created:', user.uid)
    return user
  } catch (error) {
    console.error('❌ Firebase signup error:', error)
    throw error
  }
}

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    console.log('🔥 Firebase signin:', email)
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    console.log('✅ Firebase user signed in:', user.uid)
    return user
  } catch (error) {
    console.error('❌ Firebase signin error:', error)
    throw error
  }
}

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
    console.log('✅ Firebase user signed out')
  } catch (error) {
    console.error('❌ Firebase signout error:', error)
    throw error
  }
}

// Update user role in MongoDB (we'll use MongoDB to store app-specific data)
export const updateUserRole = async (user, role) => {
  try {
    console.log('🔥 Updating user role:', { uid: user.uid, email: user.email, role })
    
    const response = await fetch('/api/auth/firebase-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        role,
      }),
    })
    
    // Handle 502 API routing issues more gracefully
    if (response.status === 502) {
      throw new Error('Server temporarily unavailable. The role selection feature is currently experiencing technical difficulties due to server routing issues. Please try again in a few moments or contact support.')
    }
    
    if (!response.ok) {
      let errorMessage = 'Failed to update role'
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (parseError) {
        // If we can't parse the response as JSON (like HTML error pages)
        console.error('❌ Failed to parse error response:', parseError)
        if (response.status === 502) {
          errorMessage = 'Server routing issue - please try again'
        } else {
          errorMessage = `Server error (${response.status})`
        }
      }
      
      throw new Error(errorMessage)
    }
    
    console.log('✅ User role updated successfully')
    return await response.json()
  } catch (error) {
    console.error('❌ Role update error:', error)
    
    // Provide more helpful error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error - please check your connection and try again')
    }
    
    throw error
  }
}

// Get user role from MongoDB
export const getUserRole = async (uid) => {
  try {
    const response = await fetch(`/api/auth/firebase-user?uid=${uid}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null // User not found in MongoDB yet
      }
      throw new Error('Failed to get user role')
    }
    
    const userData = await response.json()
    return userData
  } catch (error) {
    console.error('❌ Get user role error:', error)
    throw error
  }
}