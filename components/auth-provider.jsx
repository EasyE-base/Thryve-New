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
        try {
          const userData = await getUserRole(firebaseUser.uid)
          // getUserRole returns the full user data object, we need just the role
          setRole(userData?.role || null)
        } catch (error) {
          console.error('Error fetching user role:', error)
          setRole(null)
        }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const value = {
    user,
    role,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}