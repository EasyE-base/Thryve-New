'use client'

import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import { signUp, signIn, updateUserRole, getUserRole } from '@/lib/firebase-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Users, Building2, Star, Calendar, CreditCard, ArrowRight, CheckCircle, Globe, Award, Zap, PlayCircle, TrendingUp, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Image from 'next/image'

export default function LandingPage() {
  const [user, loading, error] = useAuthState(auth)
  const [authLoading, setAuthLoading] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const router = useRouter()

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

  // Check user role when Firebase user changes
  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        console.log('🔥 Firebase user detected:', user.email)
        
        try {
          const userData = await getUserRole(user.uid)
          
          if (!userData || !userData.role) {
            console.log('🔥 No role found, showing role selection')
            setShowRoleSelection(true)
          } else {
            console.log('🔥 User role found:', userData.role)
            setUserRole(userData.role)
            
            if (!userData.onboarding_complete) {
              console.log('🔥 Redirecting to onboarding')
              router.push(`/onboarding/${userData.role}`)
            } else {
              console.log('🔥 Redirecting to dashboard')
              router.push(`/dashboard/${userData.role}`)
            }
          }
        } catch (error) {
          console.error('❌ Error checking user role:', error)
          setShowRoleSelection(true)
        }
      }
    }

    if (!loading && user) {
      checkUserRole()
    }
  }, [user, loading, router])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      await signIn(email, password)
      toast.success('Signed in successfully!')
    } catch (error) {
      console.error('Sign-in error:', error)
      let errorMessage = 'Failed to sign in'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      
      toast.error(errorMessage)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    
    const formData = new FormData(e.target)
    const email = formData.get('email')
    const password = formData.get('password')

    try {
      await signUp(email, password)
      toast.success('Account created! Please select your role.')
      // The useEffect will handle showing role selection
    } catch (error) {
      console.error('Signup error:', error)
      let errorMessage = 'Failed to create account'
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account already exists with this email'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }
      
      toast.error(errorMessage)
    } finally {
      setAuthLoading(false)
    }
  }

  const selectRole = async (role) => {
    if (roleLoading || !user) return

    setRoleLoading(true)
    setSelectedRole(role)

    try {
      // Clear any existing role data to prevent conflicts
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tempUserData')
        localStorage.removeItem('selectedRole')
        localStorage.removeItem('onboardingComplete')
      }

      // Try to update role via API first
      await updateUserRole(user, role)
      toast.success(`Role selected: ${roles.find(r => r.id === role)?.title}`)
      
      // Redirect to onboarding
      router.push(`/onboarding/${role}`)
    } catch (error) {
      console.error('Role selection error:', error)
      
      // If it's a 502 error or API routing issue, provide a helpful message and temporary workaround
      if (error.message.includes('Server temporarily unavailable') || 
          error.message.includes('502') || 
          error.message.includes('Server routing issue')) {
        
        // Store role temporarily in localStorage as a fallback
        localStorage.setItem('selectedRole', role)
        localStorage.setItem('tempUserData', JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role,
          timestamp: Date.now() // Add timestamp to detect stale data
        }))
        
        toast.success(`Role selected: ${roles.find(r => r.id === role)?.title}. Proceeding to onboarding...`)
        
        // Still allow them to proceed to onboarding
        setTimeout(() => {
          router.push(`/onboarding/${role}`)
        }, 1000)
      } else {
        toast.error(`Failed to select role: ${error.message}`)
        setSelectedRole(null)
      }
    } finally {
      setRoleLoading(false)
    }
  }

  // Show loading while Firebase initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-light">Loading Thryve...</p>
        </div>
      </div>
    )
  }

  // Show role selection after successful signup or if user has no role
  if (showRoleSelection && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Choose Your Path
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Select your role to unlock a personalized fitness experience designed for your goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {roles.map((role) => {
              const Icon = role.icon
              return (
                <Card
                  key={role.id}
                  className="group relative cursor-pointer bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl"
                  onClick={() => selectRole(role.id)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white mb-2">
                      {role.title}
                    </CardTitle>
                    <CardDescription className="text-blue-200 text-lg">
                      {role.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-white/90">
                          <CheckCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0 text-white font-semibold py-3 group-hover:shadow-lg transition-all duration-300"
                      disabled={roleLoading && selectedRole === role.id}
                    >
                      {roleLoading && selectedRole === role.id ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Selecting...
                        </div>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <header className="relative">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
                  <div className="flex justify-start lg:w-0 lg:flex-1">
                    <div className="flex items-center">
                      <Dumbbell className="h-8 w-8 text-indigo-600" />
                      <span className="ml-2 text-2xl font-bold text-gray-900">Thryve</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Your fitness</span>{' '}
                  <span className="block text-indigo-600 xl:inline">community hub</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Book classes, teach fitness, or manage your studio. One platform connecting the entire fitness ecosystem.
                </p>
              </div>
            </main>
          </div>
        </div>
        
        {/* Auth Section */}
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 flex items-center justify-center p-8">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Join the Thryve community today</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={authLoading}
                    >
                      {authLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Create a password (min 6 characters)"
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={authLoading}
                    >
                      {authLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need in one platform
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">For Customers</p>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Book classes, track progress, and discover new instructors in your area.
                </dd>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">For Instructors</p>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Teach classes, manage your schedule, and earn money doing what you love.
                </dd>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">For Studios</p>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Manage your studio, staff, and grow your fitness business.
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by fitness professionals everywhere
            </h2>
            <p className="mt-3 text-xl text-indigo-200 sm:mt-4">
              Join thousands of fitness enthusiasts, instructors, and studios already thriving on Thryve.
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">Classes Booked</dt>
              <dd className="order-1 text-5xl font-extrabold text-white">10k+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">Active Instructors</dt>
              <dd className="order-1 text-5xl font-extrabold text-white">500+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">Partner Studios</dt>
              <dd className="order-1 text-5xl font-extrabold text-white">100+</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}