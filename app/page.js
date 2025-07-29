'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Calendar, Users, TrendingUp, Star, CheckCircle, MapPin, Clock, ChevronLeft, ChevronRight, Award, Zap, Shield, Bot, Infinity, X, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import BookingModal from '@/components/BookingModal'

// Premium fitness videos for hero section
const HERO_VIDEOS = [
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/9acvnc7j_social_based.him_A_vibrant_dynamic_photograph_captures_a_full_body_y_6b0e1611-f8ba-498d-82cb-f11a897e2e3c_1.mp4",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/ecnrqgwm_social_based.him_A_vibrant_dynamic_photograph_captures_a_young_man_r_b5e14506-2983-42c6-8ad5-d9fd686f8466_3.mp4",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/nviy43ax_08%281%29.mov",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/m42oytgc_0728.mov",
  "https://customer-assets.emergentagent.com/job_fitness-hub-28/artifacts/yqyftmfn_social_based.him_A_vibrant_dynamic_zoomed_out_photograph_of_a_full_b_4e9f2572-18d6-4c2b-9b4f-ee49eec6d415_1.mp4"
]

const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1593810451056-0acc1fad48c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1598596583430-c81c94b52dad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85"
]

const INSTRUCTOR_IMAGE = "https://images.unsplash.com/photo-1616279969096-54b228f5f103?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxmaXRuZXNzJTIwaW5zdHJ1Y3RvcnxlbnwwfHx8fDE3NTM3Mzk2NzB8MA&ixlib=rb-4.1.0&q=85"

const GYM_INTERIOR = "https://images.unsplash.com/photo-1542766788-a2f588f447ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxneW0lMjBpbnRlcmlvcnxlbnwwfHx8fDE3NTM3MTM0NDB8MA&ixlib=rb-4.1.0&q=85"

export default function Home() {
  const { user, role } = useAuth()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const heroRef = useRef(null)

  // Auto-rotate videos with smooth transitions (3 seconds per video)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
    }, 3000) // 3 seconds per video
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Mock data for live classes with enhanced booking properties
  const liveClasses = [
    {
      id: 1,
      title: "Power Vinyasa Flow",
      instructor: "Maya Chen",
      studio: "Zen Flow Studio",
      time: "7:00 AM",
      date: "Today",
      price: "$28",
      image: LIFESTYLE_IMAGES[0],
      type: "Yoga",
      capacity: 20,
      booked: 15,
      duration: 60,
      location: "Studio A, Downtown",
      description: "An energizing flow class that builds strength and flexibility"
    },
    {
      id: 2,
      title: "HIIT Bootcamp",
      instructor: "Marcus Williams",
      studio: "Strength Labs",
      time: "6:30 PM",
      date: "Today",
      price: "$35",
      image: LIFESTYLE_IMAGES[1],
      type: "HIIT",
      capacity: 18,
      booked: 18,
      duration: 45,
      location: "Main Studio, Midtown",
      description: "High-intensity interval training for maximum calorie burn"
    },
    {
      id: 3,
      title: "Pilates Reformer",
      instructor: "Sarah Johnson",
      studio: "Core Studio",
      time: "12:00 PM",
      date: "Tomorrow",
      price: "$42",
      image: LIFESTYLE_IMAGES[1],
      type: "Pilates",
      capacity: 15,
      booked: 8,
      duration: 60,
      location: "Reformer Room, Uptown",
      description: "Precision movement on the reformer for core strength"
    },
    {
      id: 4,
      title: "Boxing Fundamentals",
      instructor: "Diego Rivera",
      studio: "Fight Club NYC",
      time: "8:00 PM",
      date: "Tomorrow",
      price: "$30",
      image: LIFESTYLE_IMAGES[0],
      type: "Boxing",
      capacity: 16,
      booked: 10,
      duration: 50,
      location: "Ring Room, Brooklyn",
      description: "Learn proper boxing technique in a supportive environment"
    }
  ]

  const handleBookClass = (classData) => {
    if (!user) {
      setShowSignInModal(true)
      return
    }
    setSelectedClass(classData)
    setShowBookingModal(true)
  }

  const handleBookingSuccess = (bookingResult) => {
    // Refresh class data or update UI
    toast.success('Booking successful!')
    setShowBookingModal(false)
    setSelectedClass(null)
  }

  // Testimonials
  const testimonials = [
    {
      quote: "Thryve completely transformed how I manage my studio. The AI onboarding was seamless.",
      name: "Elena Rodriguez",
      title: "Owner, Luna Yoga Studio",
      image: INSTRUCTOR_IMAGE
    },
    {
      quote: "Finally, a platform that puts studios first. The 3.75% fee is unbeatable.",
      name: "Michael Chen",
      title: "Founder, Peak Performance",
      image: INSTRUCTOR_IMAGE
    },
    {
      quote: "My clients love the X Pass. It's brought so much more foot traffic to my classes.",
      name: "Sophia Martinez",
      title: "Pilates Instructor",
      image: INSTRUCTOR_IMAGE
    }
  ]

  // SignIn Modal Component
  const SignInModal = () => {
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setLoading(true)

      try {
        if (isSignUp) {
          // Sign up logic
          toast.success('Account created successfully!')
        } else {
          // Sign in logic  
          toast.success('Signed in successfully!')
        }
        setShowSignInModal(false)
      } catch (error) {
        toast.error('Authentication failed. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    if (!showSignInModal) return null

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1C1E]">
                  {isSignUp ? 'Join Thryve' : 'Welcome Back'}
                </h2>
                <p className="text-[#7A7A7A] mt-1">
                  {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
                </p>
              </div>
              <button
                onClick={() => setShowSignInModal(false)}
                className="p-2 hover:bg-[#EADBC8]/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#7A7A7A]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#7A7A7A] hover:text-[#1C1C1E] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-[#EADBC8] text-[#1E90FF]" />
                    <span className="ml-2 text-sm text-[#7A7A7A]">Remember me</span>
                  </label>
                  <button type="button" className="text-sm text-[#1E90FF] hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E90FF] hover:bg-[#1976D2] text-white py-3 rounded-xl font-semibold text-lg"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center">
              <p className="text-[#7A7A7A]">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-[#1E90FF] hover:underline font-medium"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-6 flex items-center">
              <div className="flex-1 border-t border-[#EADBC8]"></div>
              <span className="px-4 text-sm text-[#7A7A7A]">or</span>
              <div className="flex-1 border-t border-[#EADBC8]"></div>
            </div>

            {/* Social Login */}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#EADBC8] text-[#1C1C1E] hover:bg-[#EADBC8]/20 py-3 rounded-xl"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#EADBC8] text-[#1C1C1E] hover:bg-[#EADBC8]/20 py-3 rounded-xl"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-morphism backdrop-blur-md border-b border-white/20 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-white">
              Thryve
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/explore" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
                Explore
              </Link>
              <Link href="/xpass" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
                X Pass
              </Link>
              <Link href="/pricing" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
                Pricing
              </Link>
              <Link href="/about" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
                About
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="btn-modern bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full border border-white/30">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 btn-modern"
                    onClick={() => setShowSignInModal(true)}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="btn-modern bg-white text-black hover:bg-white/90 px-6 py-2 rounded-full font-semibold"
                    onClick={() => setShowSignInModal(true)}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Videos with Smooth Transition */}
        <div className="absolute inset-0">
          {HERO_VIDEOS.map((videoSrc, index) => (
            <video
              key={index}
              autoPlay
              loop
              muted
              playsInline
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ${
                index === currentVideoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
              style={{
                transitionDuration: '2000ms',
                transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <source src={videoSrc} type="video/mp4" />
              {/* Fallback for this specific video */}
              {index === 0 && (
                <img 
                  src={LIFESTYLE_IMAGES[0]} 
                  alt="Fitness Hero"
                  className="w-full h-full object-cover"
                />
              )}
            </video>
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1E]/80 via-[#1C1C1E]/60 to-transparent z-20"></div>
        </div>

        {/* Video Indicators */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30 flex space-x-2">
          {HERO_VIDEOS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentVideoIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentVideoIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-30 text-center text-white px-6 max-w-5xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
            Train. Book. <span className="text-[#1E90FF]">Thrive.</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-gray-200 max-w-3xl mx-auto leading-relaxed">
            The future of wellness booking & management starts here.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/explore">
              <Button size="lg" className="bg-[#1E90FF] hover:bg-[#1976D2] text-white px-8 py-4 rounded-full text-lg font-semibold">
                Book a Class
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-[#1C1C1E] px-8 py-4 rounded-full text-lg font-semibold"
              onClick={() => setShowSignInModal(true)}
            >
              Studio? Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Thryve - Feature Strip */}
      <section className="section-padding section-gradient">
        <div className="container-modern">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold text-[#1C1C1E] mb-8 fade-in-up">Why Thryve?</h2>
            <p className="text-2xl text-[#7A7A7A] max-w-4xl mx-auto leading-relaxed fade-in-up">
              Built for studios, loved by customers. The only platform that truly puts your business first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="text-center group hover-lift card-hover">
              <div className="glass-morphism w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 smooth-transition">
                <Zap className="h-12 w-12 text-[#1E90FF]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1C1E] mb-4">Flat 3.75% fee</h3>
              <p className="text-[#7A7A7A] text-lg leading-relaxed">That's it. No hidden costs, no surprises.</p>
            </div>

            <div className="text-center group hover-lift card-hover">
              <div className="glass-morphism w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 smooth-transition">
                <Shield className="h-12 w-12 text-[#1E90FF]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1C1E] mb-4">No Monthly Costs</h3>
              <p className="text-[#7A7A7A] text-lg leading-relaxed">Pay only when you earn. Zero subscription fees.</p>
            </div>

            <div className="text-center group hover-lift card-hover">
              <div className="glass-morphism w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 smooth-transition">
                <Award className="h-12 w-12 text-[#1E90FF]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1C1E] mb-4">Your Brand First</h3>
              <p className="text-[#7A7A7A] text-lg leading-relaxed">Keep your customers. Build your community.</p>
            </div>

            <div className="text-center group hover-lift card-hover">
              <div className="glass-morphism w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 smooth-transition">
                <Bot className="h-12 w-12 text-[#1E90FF]" />
              </div>
              <h3 className="text-2xl font-bold text-[#1C1C1E] mb-4">AI Onboarding</h3>
              <p className="text-[#7A7A7A] text-lg leading-relaxed">From Mindbody to live in minutes, not months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Discovery Feed */}
      <section className="section-padding section-gradient-alt">
        <div className="container-modern">
          <div className="text-center mb-20">
            <h2 className="text-6xl font-bold text-[#1C1C1E] mb-8 fade-in-up">Trending Classes</h2>
            <p className="text-2xl text-[#7A7A7A] fade-in-up">Join thousands discovering their next favorite workout</p>
          </div>

          <div className="relative">
            <div className="flex overflow-x-auto space-x-8 pb-6 scrollbar-hide">
              {liveClasses.map((classItem) => (
                <div key={classItem.id} className="flex-shrink-0 w-96 group">
                  <Card className="border-0 shadow-2xl hover:shadow-3xl card-hover glass-morphism overflow-hidden">
                    <div className="relative">
                      <img 
                        src={classItem.image} 
                        alt={classItem.title}
                        className="w-full h-56 object-cover group-hover:scale-105 smooth-transition"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#1E90FF]/90 text-white backdrop-blur-sm border border-white/20">
                          {classItem.type}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4 glass-morphism px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white font-bold text-lg">{classItem.price}</span>
                      </div>
                    </div>
                    <CardContent className="p-8">
                      <h3 className="font-bold text-2xl text-[#1C1C1E] mb-3">{classItem.title}</h3>
                      <p className="text-[#7A7A7A] mb-2 text-lg">with {classItem.instructor}</p>
                      <p className="text-[#7A7A7A] mb-4 text-lg">{classItem.studio}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[#7A7A7A]">
                          <Clock className="h-5 w-5 mr-2" />
                          <span className="text-lg">{classItem.time}</span>
                        </div>
                        <Button className="btn-modern bg-[#1E90FF] hover:bg-[#1976D2] text-white px-6 py-3 rounded-xl">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#1C1C1E] mb-6">How It Works</h2>
            <p className="text-xl text-[#7A7A7A]">Simple for studios, seamless for users</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Studios */}
            <div>
              <h3 className="text-3xl font-bold text-[#1C1C1E] mb-8 text-center">For Studios</h3>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">1</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Create Your Profile</h4>
                    <p className="text-[#7A7A7A]">Upload your studio details, photos, and amenities in minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">2</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Upload Classes</h4>
                    <p className="text-[#7A7A7A]">Add your class schedule with our AI-powered import tool</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">3</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Get Bookings</h4>
                    <p className="text-[#7A7A7A]">Start receiving bookings immediately with instant payouts</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Users */}
            <div>
              <h3 className="text-3xl font-bold text-[#1C1C1E] mb-8 text-center">For Users</h3>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">1</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Browse Classes</h4>
                    <p className="text-[#7A7A7A]">Discover amazing classes near you or try something new</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">2</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Book Instantly</h4>
                    <p className="text-[#7A7A7A]">Secure your spot with one click, no hassle required</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#1E90FF] text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">3</div>
                  <div>
                    <h4 className="font-bold text-xl text-[#1C1C1E] mb-2">Show Up & Sweat</h4>
                    <p className="text-[#7A7A7A]">Focus on your workout, we'll handle the rest</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stats */}
      <section className="py-24 bg-[#1C1C1E]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">Trusted by the Best</h2>
            <p className="text-xl text-gray-300">Join the growing community of successful studios</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1E90FF] mb-2">50K+</div>
              <div className="text-gray-300">Classes Booked</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1E90FF] mb-2">1,200+</div>
              <div className="text-gray-300">Studio Partners</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1E90FF] mb-2">85+</div>
              <div className="text-gray-300">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-[#1E90FF] mb-2">4.9★</div>
              <div className="text-gray-300">Studio Rating</div>
            </div>
          </div>

          {/* Studio Logos */}
          <div className="flex justify-center items-center space-x-12 opacity-60 grayscale">
            <div className="text-2xl font-bold text-white">YogaWorks</div>
            <div className="text-2xl font-bold text-white">SoulCycle</div>
            <div className="text-2xl font-bold text-white">CorePower</div>
            <div className="text-2xl font-bold text-white">Barry's</div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#1C1C1E] mb-6">What Studios Say</h2>
            <p className="text-xl text-[#7A7A7A]">Real stories from real studio owners</p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <Card className="border-0 shadow-xl bg-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="mb-8">
                    <img 
                      src={testimonials[currentTestimonial].image} 
                      alt={testimonials[currentTestimonial].name}
                      className="w-20 h-20 rounded-full mx-auto object-cover"
                    />
                  </div>
                  <blockquote className="text-2xl text-[#1C1C1E] mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].quote}"
                  </blockquote>
                  <div className="text-center">
                    <div className="font-bold text-xl text-[#1C1C1E]">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="text-[#7A7A7A]">
                      {testimonials[currentTestimonial].title}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-[#1E90FF]' : 'bg-[#EADBC8]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* X Pass Banner */}
      <section className="py-24 bg-gradient-to-r from-[#1E90FF] to-[#4A90E2]">
        <div className="container mx-auto px-6">
          <div className="text-center text-white">
            <div className="flex justify-center mb-6">
              <Infinity className="h-16 w-16" />
            </div>
            <h2 className="text-5xl font-bold mb-6">Thryve X Pass</h2>
            <p className="text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              One membership. Thousands of classes. Unlimited discovery.
            </p>
            <p className="text-xl mb-12 max-w-2xl mx-auto opacity-75">
              Access premium studios across your city with a single pass. More freedom for you, better revenue for studios.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="bg-white text-[#1E90FF] hover:bg-gray-100 px-8 py-4 rounded-full text-lg font-semibold">
                Get X Pass
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1E90FF] px-8 py-4 rounded-full text-lg font-semibold">
                Accept X Pass
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-morphism text-white relative overflow-hidden">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/20"></div>
        
        <div className="relative z-10 section-padding">
          <div className="container-modern">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
              <div className="space-y-8">
                <div className="text-4xl font-bold mb-8">Thryve</div>
                <p className="text-white/80 mb-8 text-lg leading-relaxed">
                  The future of wellness booking & management. Built for studios, loved by everyone.
                </p>
                <div className="flex space-x-4">
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full btn-modern">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full btn-modern">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                    </svg>
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white/70 hover:text-white p-3 hover:bg-white/10 rounded-full btn-modern">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.887 2.747.099.119.112.223.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.69-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z."/>
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold mb-6 text-2xl text-white">Platform</h3>
                <ul className="space-y-4 text-white/80 text-lg">
                  <li><Link href="/explore" className="hover:text-white smooth-transition hover:translate-x-2 block">Explore Classes</Link></li>
                  <li><Link href="/xpass" className="hover:text-white smooth-transition hover:translate-x-2 block">X Pass</Link></li>
                  <li><Link href="/marketplace" className="hover:text-white smooth-transition hover:translate-x-2 block">Find Instructors</Link></li>
                  <li><Link href="/pricing" className="hover:text-white smooth-transition hover:translate-x-2 block">Pricing</Link></li>
                </ul>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold mb-6 text-2xl text-white">Support</h3>
                <ul className="space-y-4 text-white/80 text-lg">
                  <li><Link href="/help-center" className="hover:text-white smooth-transition hover:translate-x-2 block">Help Center</Link></li>
                  <li><Link href="/contact-us" className="hover:text-white smooth-transition hover:translate-x-2 block">Contact Us</Link></li>
                  <li><Link href="/community" className="hover:text-white smooth-transition hover:translate-x-2 block">Community</Link></li>
                </ul>
              </div>

              <div className="space-y-6">
                <h3 className="font-semibold mb-6 text-2xl text-white">Legal</h3>
                <ul className="space-y-4 text-white/80 text-lg">
                  <li><Link href="/privacy-policy" className="hover:text-white smooth-transition hover:translate-x-2 block">Privacy Policy</Link></li>
                  <li><Link href="/terms-of-service" className="hover:text-white smooth-transition hover:translate-x-2 block">Terms of Service</Link></li>
                  <li><Link href="/cookie-policy" className="hover:text-white smooth-transition hover:translate-x-2 block">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center text-white/70">
              <p className="text-lg">&copy; 2024 Thryve. All rights reserved.</p>
              <p className="text-lg mt-4 md:mt-0">Built with love for the wellness community.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* SignIn Modal */}
      <SignInModal />
    </div>
  )
}