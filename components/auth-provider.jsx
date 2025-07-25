'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { getUserRole } from '@/lib/firebase-auth'

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
          const userRole = userData?.role || null
          console.log('🔥 AuthProvider: Setting role:', userRole)
          
          setRole(userRole)
        } catch (error) {
          console.error('❌ AuthProvider: Error fetching user role:', error)
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

  const value = {
    user,
    role,
    loading,
    refreshRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}