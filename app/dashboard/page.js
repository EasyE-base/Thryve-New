'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardRouter() {
  const router = useRouter()
  const { user, role, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    
    if (!user) {
      // Redirect to signup if not authenticated
      router.push('/signup')
      return
    }

    // Redirect to role-specific dashboard
    switch (role) {
      case 'merchant':
      case 'studio-owner':
        router.push('/dashboard/merchant')
        break
      case 'instructor':
        router.push('/dashboard/instructor')
        break
      case 'customer':
      case 'client':
        router.push('/dashboard/customer')
        break
      default:
        // If role is not set, redirect to role selection
        router.push('/signup/role-selection')
        break
    }
  }, [user, role, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}