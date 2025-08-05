'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
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
        setUser(firebaseUser)
        
        // Set loading to true when fetching role data
        setLoading(true)
        
        try {
          console.log('🔥 AuthProvider: Fetching role for user:', firebaseUser.uid)
          const userData = await getUserRole(firebaseUser.uid)
          console.log('🔥 AuthProvider: Got user data:', userData)
          
          // getUserRole returns the full user data object, we need just the role
          let userRole = userData?.role || null
          let onboardingStatus = userData?.onboard_complete || false
          
          // Fallback: Check localStorage if API is not available
          if (!userRole && typeof window !== 'undefined') {
            const pendingUserData = localStorage.getItem('pendingRoleSelection')
            if (pendingUserData) {
              try {
                const parsedData = JSON.parse(pendingUserData)
                // Check if the data is for the current user and not too old (1 hour)
                const isCurrentUser = parsedData.uid === firebaseUser.uid
                const isRecent = parsedData.timestamp && (Date.now() - parsedData.timestamp) < 3600000 // 1 hour
                
                if (isCurrentUser && (!parsedData.timestamp || isRecent)) {
                  userRole = parsedData.role
                  onboardingStatus = parsedData.onboardingCompleted || false
                  console.log('🔥 AuthProvider: Using localStorage fallback role:', userRole)
                } else if (!isRecent) {
                  console.log('🔥 AuthProvider: Clearing stale localStorage data')
                  localStorage.removeItem('pendingRoleSelection')
                }
              } catch (e) {
                console.error('Failed to parse localStorage data:', e)
                // Clean up corrupted data
                localStorage.removeItem('pendingRoleSelection')
              }
            }
          }
          
          console.log('🔥 AuthProvider: Setting role:', userRole, 'onboarding:', onboardingStatus)
          setRole(userRole)
          setOnboardingCompleted(onboardingStatus)
          
          // Sync user data to cookies for middleware
          if (typeof document !== 'undefined') {
            const cookieData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: userRole,
              onboardingCompleted: onboardingStatus
            }
            
            // Set cookie for middleware (expires in 24 hours)
            const expires = new Date()
            expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000))
            
            document.cookie = `user=${JSON.stringify(cookieData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
            console.log('🔥 AuthProvider: Set user cookie for middleware')
          }
          
        } catch (error) {
          console.error('❌ AuthProvider: Error fetching user role:', error)
          
          // Fallback: Check localStorage if API fails
          if (typeof window !== 'undefined') {
            const pendingUserData = localStorage.getItem('pendingRoleSelection')
            if (pendingUserData) {
              try {
                const parsedData = JSON.parse(pendingUserData)
                if (parsedData.uid === firebaseUser.uid) {
                  console.log('🔥 AuthProvider: Using localStorage fallback due to API error:', parsedData.role)
                  setRole(parsedData.role)
                  setOnboardingCompleted(parsedData.onboardingCompleted || false)
                  
                  // Still set cookie even with fallback data
                  if (typeof document !== 'undefined') {
                    const cookieData = {
                      uid: firebaseUser.uid,
                      email: firebaseUser.email,
                      role: parsedData.role,
                      onboardingCompleted: parsedData.onboardingCompleted || false
                    }
                    
                    const expires = new Date()
                    expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000))
                    document.cookie = `user=${JSON.stringify(cookieData)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
                  }
                  return
                }
              } catch (e) {
                console.error('Failed to parse localStorage fallback data:', e)
              }
            }
          }
          
          setRole(null)
          setOnboardingCompleted(false)
        } finally {
          // Set loading to false after role fetch completes (success or error)
          setLoading(false)
        }
      } else {
        console.log('🔥 AuthProvider: No user, clearing state')
        setUser(null)
        setRole(null)
        setOnboardingCompleted(false)
        setLoading(false)
        
        // Clear cookies and localStorage when user logs out
        if (typeof document !== 'undefined') {
          document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          console.log('🔥 AuthProvider: Cleared user cookie')
        }
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pendingRoleSelection')
        }
      }
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
    role,
    loading,
    onboardingCompleted,
    refreshRole,
    completeOnboarding,
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}