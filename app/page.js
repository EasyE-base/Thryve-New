'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { signIn, signUp, handleRoleSelection } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dumbbell, Users, Building2, Star, Calendar, CreditCard, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function LandingPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(false)
  const [roleLoading, setRoleLoading] = useState(false)
  const router = useRouter()
  
  const supabase = createClient()

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
  
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const role = session.user.user_metadata?.role
        const onboardingComplete = session.user.user_metadata?.onboarding_complete
        
        if (!role) {
          router.push('/signup/role-selection')
        } else if (!onboardingComplete) {
          router.push(`/onboarding/${role}`)
        } else {
          router.push(`/dashboard/${role}`)
        }
      }
      setLoading(false)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const role = session.user.user_metadata?.role
          const onboardingComplete = session.user.user_metadata?.onboarding_complete
          
          if (!role) {
            router.push('/signup/role-selection')
          } else if (!onboardingComplete) {
            router.push(`/onboarding/${role}`)
          } else {
            router.push(`/dashboard/${role}`)
          }
        }
        setUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

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
      toast.error(error.message || 'Failed to sign in')
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
      const result = await signUp(email, password)
      console.log('Signup result:', result)
      
      if (result.user && result.session) {
        toast.success('Account created! Please select your role.')
        setUser(result.user)
        setShowRoleSelection(true)
      } else {
        toast.error('Failed to create account - no session created')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                        placeholder="Create a password"
                        required
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