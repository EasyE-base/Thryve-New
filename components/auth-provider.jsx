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
          
          // Fallback: Check localStorage if API is not available
          if (!userRole && typeof window !== 'undefined') {
            const tempUserData = localStorage.getItem('tempUserData')
            if (tempUserData) {
              try {
                const parsedData = JSON.parse(tempUserData)
                // Check if the data is for the current user and not too old (1 hour)
                const isCurrentUser = parsedData.uid === firebaseUser.uid
                const isRecent = parsedData.timestamp && (Date.now() - parsedData.timestamp) < 3600000 // 1 hour
                
                if (isCurrentUser && (!parsedData.timestamp || isRecent)) {
                  userRole = parsedData.role
                  console.log('🔥 AuthProvider: Using localStorage fallback role:', userRole)
                } else if (!isRecent) {
                  console.log('🔥 AuthProvider: Clearing stale localStorage data')
                  localStorage.removeItem('tempUserData')
                  localStorage.removeItem('selectedRole')
                }
              } catch (e) {
                console.error('Failed to parse localStorage data:', e)
                // Clean up corrupted data
                localStorage.removeItem('tempUserData')
                localStorage.removeItem('selectedRole')
              }
            }
          }
          
          console.log('🔥 AuthProvider: Setting role:', userRole)
          setRole(userRole)
        } catch (error) {
          console.error('❌ AuthProvider: Error fetching user role:', error)
          
          // Fallback: Check localStorage if API fails
          if (typeof window !== 'undefined') {
            const tempUserData = localStorage.getItem('tempUserData')
            if (tempUserData) {
              try {
                const parsedData = JSON.parse(tempUserData)
                if (parsedData.uid === firebaseUser.uid) {
                  console.log('🔥 AuthProvider: Using localStorage fallback due to API error:', parsedData.role)
                  setRole(parsedData.role)
                  return
                }
              } catch (e) {
                console.error('Failed to parse localStorage fallback data:', e)
              }
            }
          }
          
          setRole(null)
        } finally {
          // Set loading to false after role fetch completes (success or error)
          setLoading(false)
        }
      } else {
        console.log('🔥 AuthProvider: No user, clearing state')
        setUser(null)
        setRole(null)
        setLoading(false)
        
        // Clear localStorage when user logs out
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tempUserData')
          localStorage.removeItem('selectedRole')
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
        console.log('🔥 AuthProvider: Refreshed role:', userRole)
        setRole(userRole)
      } catch (error) {
        console.error('❌ AuthProvider: Error refreshing user role:', error)
      } finally {
        setLoading(false)
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
    refreshRole,
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