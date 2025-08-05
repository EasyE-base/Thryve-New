'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function LandingNavigation({ onSignIn, onSignUp }) {
  const { user, role, loading, onboardingCompleted } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  
  // CRITICAL DEBUG: Log the auth state
  console.log('🔥 LandingNavigation Auth State:', { user: !!user, role, loading, onboardingCompleted })

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle dashboard navigation
  const handleDashboardClick = () => {
    if (user && role) {
      router.push(`/dashboard/${role}`)
    }
  }

  // Don't render anything until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <nav className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-xl font-bold text-black">
            Thryve
          </Link>
          <div className="hidden md:flex space-x-6">
            <Link href="/explore" className="text-gray-600 hover:text-black transition-colors">
              Explore
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-black transition-colors">
              Pricing
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-gray-600">Loading...</div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="flex items-center justify-between p-4 bg-white shadow-sm" data-component="LandingNavigation">
      <div className="flex items-center space-x-8">
        <Link href="/" className="text-xl font-bold text-black">
          Thryve
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link href="/explore" className="text-gray-600 hover:text-black transition-colors">
            Explore
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-black transition-colors">
            Pricing
          </Link>
          {/* CRITICAL FIX: Only show Dashboard if user is authenticated AND has completed onboarding */}
          {user && role && onboardingCompleted && (
            <button 
              onClick={handleDashboardClick}
              className="text-gray-600 hover:text-black transition-colors bg-transparent border-none cursor-pointer"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : user && onboardingCompleted ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">
              Welcome, {user.displayName || user.email}
            </span>
            <Button 
              variant="outline" 
              onClick={() => {
                // Import dynamically to avoid SSR issues
                import('@/lib/firebase-auth').then(({ signOut }) => signOut())
              }}
            >
              Sign Out
            </Button>
          </div>
        ) : user && !onboardingCompleted ? (
          <div className="flex items-center space-x-4">
            <Link href={role ? `/onboarding/${role}` : '/signup/role-selection'}>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                Complete Setup
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={onSignIn}
            >
              Sign In
            </Button>
            <Link href="/signup">
              <Button>
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}