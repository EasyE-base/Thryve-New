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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Thryve</span>
            </div>
            
            {!user && (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-blue-400 hover:bg-white/10"
                  onClick={() => router.push('/about')}
                >
                  About
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-white hover:text-blue-400 hover:bg-white/10"
                  onClick={() => router.push('/pricing')}
                >
                  Pricing
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                  onClick={() => setShowRoleSelection(true)}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left">
              <h1 className="text-6xl md:text-8xl font-bold text-white leading-tight mb-8">
                Your Fitness
                <span className="block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Revolution
                </span>
                Starts Here
              </h1>
              
              <p className="text-xl text-blue-200 mb-8 leading-relaxed max-w-xl">
                Connect with world-class instructors, discover premium studios, and transform your fitness journey with our revolutionary platform.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 px-8 py-4 text-lg font-semibold rounded-xl"
                  onClick={() => setShowRoleSelection(true)}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg rounded-xl"
                  onClick={() => toast.info('Demo video coming soon!')}
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                  </div>
                  <span className="text-white/80 text-sm">Join 50K+ members</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-white/80 text-sm ml-2">4.9/5 rating</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1541694458248-5aa2101c77df"
                  alt="Premium Fitness Experience"
                  width={600}
                  height={800}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
              </div>
              
              {/* Floating stats cards */}
              <div className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">+127%</p>
                    <p className="text-white/70 text-sm">Growth Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">#1</p>
                    <p className="text-white/70 text-sm">Fitness Platform</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Why Choose <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Thryve</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Experience the future of fitness with cutting-edge technology and unmatched convenience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Global Network</h3>
              <p className="text-blue-200">Connect with premium studios and certified instructors worldwide</p>
            </div>

            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Instant Booking</h3>
              <p className="text-blue-200">Book classes instantly with our lightning-fast platform</p>
            </div>

            <div className="group text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure & Trusted</h3>
              <p className="text-blue-200">Bank-level security with 100% payment protection</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-4xl font-bold text-white mb-6">
                  Transform Your Fitness Journey
                </h3>
                <p className="text-blue-200 mb-8 text-lg leading-relaxed">
                  Join thousands of fitness enthusiasts who have discovered their perfect workout routine through our intelligent matching system.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-white">Personalized class recommendations</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-white">Progress tracking and analytics</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                    <span className="text-white">Community challenges and rewards</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1488345979593-09db0f85545f"
                    alt="Wellness Experience"
                    width={500}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">50K+</div>
              <div className="text-blue-200">Active Members</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-200">Expert Instructors</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-200">Partner Studios</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">1M+</div>
              <div className="text-blue-200">Classes Booked</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center">
            <h2 className="text-5xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
              Join the fitness revolution and discover what makes Thryve the #1 choice for fitness enthusiasts worldwide.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 px-12 py-4 text-xl font-semibold rounded-xl"
              onClick={() => setShowRoleSelection(true)}
            >
              Get Started Free
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </section>

      {/* Authentication Modal */}
      {!user && showRoleSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Join Thryve Today</h3>
              <p className="text-blue-200">Create your account to get started</p>
            </div>

            <Tabs defaultValue="signup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10">
                <TabsTrigger value="signup" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">Sign Up</TabsTrigger>
                <TabsTrigger value="signin" className="text-white data-[state=active]:bg-blue-500 data-[state=active]:text-white">Sign In</TabsTrigger>
              </TabsList>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Create a password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                    disabled={authLoading}
                  >
                    {authLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email" className="text-white">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signin-password" className="text-white">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter your password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0"
                    disabled={authLoading}
                  >
                    {authLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Button 
              variant="ghost" 
              className="w-full mt-4 text-white hover:bg-white/10"
              onClick={() => setShowRoleSelection(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}