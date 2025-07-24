'use client'

import { useState, useEffect } from 'react'
import { handleRoleSelection } from '@/lib/auth'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Dumbbell, Building2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function RoleSelection() {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()
  
  const supabase = createClient()

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Role selection - Session check:', session)
        
        if (session?.user) {
          setUser(session.user)
          console.log('User found:', session.user.email, 'Confirmed:', session.user.email_confirmed_at)
        } else {
          console.log('No session found, waiting for auth state change...')
          // Don't immediately set authLoading to false, wait for auth state change
          setTimeout(() => {
            if (!user) {
              console.log('Still no user after timeout')
              setAuthLoading(false)
            }
          }, 3000) // Wait 3 seconds for session to establish
          return
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        if (user) {
          setAuthLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        if (session?.user) {
          setUser(session.user)
          setAuthLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAuthLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const roles = [
    {
      id: 'customer',
      title: 'Customer',
      icon: Users,
      description: 'Book fitness classes and track your progress',
      features: [
        'Browse and book classes',
        'Track your fitness journey',
        'Connect with instructors',
        'Manage your schedule'
      ]
    },
    {
      id: 'instructor',
      title: 'Instructor',
      icon: Dumbbell,
      description: 'Teach classes and earn money doing what you love',
      features: [
        'Create and manage classes',
        'Set your own schedule',
        'Earn money from bookings',
        'Build your client base'
      ]
    },
    {
      id: 'merchant',
      title: 'Studio Owner',
      icon: Building2,
      description: 'Manage your studio and grow your fitness business',
      features: [
        'Manage multiple locations',
        'Oversee staff and instructors',
        'Track business analytics',
        'Handle payments and bookings'
      ]
    }
  ]

  const selectRole = async (role) => {
    if (loading) return

    // Check if user is authenticated
    if (!user) {
      toast.error('Please sign up or log in first to select a role.')
      router.push('/')
      return
    }

    setLoading(true)
    setSelectedRole(role)

    try {
      console.log('Attempting to select role:', role, 'for user:', user.email)
      
      await handleRoleSelection(role)
      toast.success(`Role selected: ${roles.find(r => r.id === role)?.title}`)
      
      // Wait a moment for the user metadata to update
      setTimeout(() => {
        router.push(`/onboarding/${role}`)
      }, 1000)
    } catch (error) {
      console.error('Role selection error:', error)
      toast.error(error.message || 'Failed to select role')
      setSelectedRole(null)
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show message if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You need to be logged in to select a role. Please sign up or log in first.
          </p>
          <Button onClick={() => router.push('/')}>
            Go to Sign Up / Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose Your Role
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Select how you'd like to use Thryve to get started
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            const isLoading = loading && isSelected

            return (
              <Card
                key={role.id}
                className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                }`}
                onClick={() => selectRole(role.id)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {role.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {role.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    disabled={loading}
                    variant={isSelected ? "default" : "outline"}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Selecting...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Choose {role.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Don't worry, you can always change your role later in your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}