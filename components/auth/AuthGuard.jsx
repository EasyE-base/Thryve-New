'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGuard({ 
  children, 
  requiredAuth = true, 
  allowedRoles = [], 
  redirectTo = '/login',
  fallback = null 
}) {
  const { user, role, loading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    if (loading) return

    // If no auth required, allow access
    if (!requiredAuth) {
      setIsAuthorized(true)
      return
    }

    // If auth required but user not authenticated
    if (!isAuthenticated || !user) {
      router.push(redirectTo)
      return
    }

    // If specific roles are required
    if (allowedRoles.length > 0) {
      if (!role || !allowedRoles.includes(role)) {
        // Redirect to appropriate page based on role
        const roleRedirects = {
          'studio_owner': '/dashboard/merchant',
          'instructor': '/dashboard/instructor',
          'client': '/dashboard/customer'
        }
        const redirectPath = roleRedirects[role] || '/dashboard'
        router.push(redirectPath)
        return
      }
    }

    setIsAuthorized(true)
  }, [user, role, loading, isAuthenticated, requiredAuth, allowedRoles, redirectTo, router])

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  return children
} 