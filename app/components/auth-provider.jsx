'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { syncAuthState, syncCustomClaims } from '@/lib/client-session'
import { getUserRole, signUp as firebaseSignUp, signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase-auth'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await syncAuthState(firebaseUser)
          console.log('🔥 AuthProvider: User authenticated:', firebaseUser.email)
          setUser(firebaseUser)
        } catch (error) {
          console.error('🔥 AuthProvider: Error syncing session:', error)
          setUser(null)
        }
      } else {
        console.log('🔥 AuthProvider: No authenticated user')
        await syncAuthState(null)
        setUser(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Function to refresh role data (useful after role updates)
  const refreshRole = async () => {
    if (user) {
      setLoading(true)
      try {
        console.log('🔥 AuthProvider: Refreshing role for user:', user.uid)
        const userData = await getUserRole(user.uid)
        const userRole = userData?.role || null
        const onboardingStatus = userData?.onboard_complete || false
        console.log('🔥 AuthProvider: Refreshed role:', userRole, 'onboarding:', onboardingStatus)
        setRole(userRole)
        setOnboardingCompleted(onboardingStatus)
      } catch (error) {
        console.error('❌ AuthProvider: Error refreshing user role:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  // Function to mark onboarding as completed
  const completeOnboarding = async () => {
    setOnboardingCompleted(true)
    
    // Update the cookie with the new onboarding status
    if (typeof document !== 'undefined' && user) {
      const cookieData = {
        uid: user.uid,
        email: user.email,
        role: role,
        onboardingCompleted: true
      }
      
      const expires = new Date()
      expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000))
      document.cookie = `user=${JSON.stringify(cookieData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
      console.log('🔥 AuthProvider: Updated user cookie with onboarding completion')
    }
    
    // Also update localStorage if it exists
    if (typeof window !== 'undefined') {
      const pendingUserData = localStorage.getItem('pendingRoleSelection')
      if (pendingUserData) {
        try {
          const parsedData = JSON.parse(pendingUserData)
          parsedData.onboardingCompleted = true
          localStorage.setItem('pendingRoleSelection', JSON.stringify(parsedData))
        } catch (e) {
          console.error('Failed to update localStorage onboarding status:', e)
        }
      }
    }
  }

  // Auth functions
  const signUp = async (email, password) => {
    try {
      const user = await firebaseSignUp(email, password)
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      const user = await firebaseSignIn(email, password)
      return { success: true, user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    syncCustomClaims,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}