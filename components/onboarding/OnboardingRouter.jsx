'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { useOnboarding } from './OnboardingProvider'
import { Spinner } from '@/components/ui/spinner'

export default function OnboardingRouter({ children }) {
  const { user, role, loading: authLoading } = useAuth()
  const { onboardingStatus, loading: onboardingLoading } = useOnboarding()
  const router = useRouter()

  useEffect(() => {
    if (authLoading || onboardingLoading) return

    // No user - redirect to home
    if (!user) {
      router.push('/')
      return
    }

    // User exists but no role - they might be in sign-up flow
    if (!role) {
      return // Let them stay where they are
    }

    // User has role but onboarding not complete - redirect to onboarding
    if (!onboardingStatus.isComplete) {
      const currentPath = window.location.pathname
      const expectedPath = `/onboarding/${role}`
      
      if (!currentPath.startsWith('/onboarding/')) {
        router.push(expectedPath)
      }
    }

    // User has role and onboarding complete - allow access to protected routes
    // but redirect to dashboard if they're on onboarding page
    if (onboardingStatus.isComplete) {
      const currentPath = window.location.pathname
      
      if (currentPath.startsWith('/onboarding/')) {
        router.push(`/dashboard/${role}`)
      }
    }
  }, [user, role, onboardingStatus.isComplete, authLoading, onboardingLoading, router])

  // Show loading while checking auth and onboarding status
  if (authLoading || onboardingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mb-4 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return children
}