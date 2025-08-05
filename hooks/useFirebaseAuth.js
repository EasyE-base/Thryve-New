'use client'

import { useState, useEffect } from 'react'
import { 
  onAuthStateChange, 
  onUserProfileChange,
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword as firebaseSignIn,
  signInWithGoogle,
  linkGoogleAccount,
  signOutUser,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  createUserProfile,
  updateUserProfile,
  initializeUserProfile
} from '@/lib/auth'

export function useFirebaseAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profileUnsubscribe, setProfileUnsubscribe] = useState(null)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        console.log('🔥 Firebase Auth: User signed in', firebaseUser.uid)
        setUser(firebaseUser)
        setIsAuthenticated(true)
        
        // Initialize user profile if needed
        await initializeUserProfile(firebaseUser)
        
        // Listen to profile changes
        const unsubscribeProfile = onUserProfileChange(firebaseUser.uid, (profileData) => {
          console.log('🔥 Firebase Profile: Updated', profileData)
          setProfile(profileData)
          setLoading(false)
        })
        
        setProfileUnsubscribe(() => unsubscribeProfile)
      } else {
        console.log('🔥 Firebase Auth: User signed out')
        setUser(null)
        setProfile(null)
        setIsAuthenticated(false)
        setLoading(false)
        
        // Clean up profile listener
        if (profileUnsubscribe) {
          profileUnsubscribe()
          setProfileUnsubscribe(null)
        }
      }
    })

    return () => {
      unsubscribeAuth()
      if (profileUnsubscribe) {
        profileUnsubscribe()
      }
    }
  }, [])

  const signUp = async (userData) => {
    setLoading(true)
    try {
      const result = await signUpWithEmailAndPassword(
        userData.email, 
        userData.password, 
        userData.name
      )
      
      if (result.success) {
        // Store signup data for role selection
        localStorage.setItem('thryve_signup_data', JSON.stringify({
          ...userData,
          userId: result.user.uid
        }))
        
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const result = await firebaseSignIn(email, password)
      return result
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('thryve_user')
      localStorage.removeItem('thryve_user_role')
      localStorage.removeItem('thryve_signup_data')
      
      const result = await signOutUser()
      return result
    } catch (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }
  }

  const completeSignup = async (userData) => {
    try {
      if (!user) {
        return { success: false, error: 'No authenticated user found' }
      }

      // Update user profile with role and complete onboarding
      const result = await updateUserProfile(user.uid, {
        role: userData.role,
        profileCompleted: true,
        name: userData.name,
        email: userData.email
      })

      if (result.success) {
        // Clean up signup data
        localStorage.removeItem('thryve_signup_data')
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Complete signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      if (!user) {
        return { success: false, error: 'No authenticated user found' }
      }

      const result = await updateUserProfile(user.uid, profileData)
      return result
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  }

  const signInWithGoogleAuth = async () => {
    setLoading(true)
    try {
      const result = await signInWithGoogle()
      
      if (result.success && result.isNewUser) {
        // New Google user - store signup data for role selection
        localStorage.setItem('thryve_signup_data', JSON.stringify({
          userId: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          provider: 'google'
        }))
      }
      
      return result
    } catch (error) {
      console.error('Google sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const linkGoogle = async (credential) => {
    try {
      const result = await linkGoogleAccount(credential)
      return result
    } catch (error) {
      console.error('Link Google error:', error)
      return { success: false, error: error.message }
    }
  }

  const sendPasswordResetEmail = async (email) => {
    try {
      const result = await firebaseSendPasswordResetEmail(email)
      return result
    } catch (error) {
      console.error('Password reset error:', error)
      return { success: false, error: error.message }
    }
  }

  // Computed values for compatibility with existing code
  const role = profile?.role || null
  const userId = user?.uid || null

  return {
    user,
    profile,
    role,
    userId,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle: signInWithGoogleAuth,
    linkGoogle,
    signOut,
    completeSignup,
    updateProfile,
    sendPasswordResetEmail
  }
}