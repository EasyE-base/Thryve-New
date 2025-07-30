'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Calendar, Users, TrendingUp, Star, CheckCircle, MapPin, Clock, ChevronLeft, ChevronRight, Award, Zap, Shield, Bot, Infinity, X, Eye, EyeOff, MessageCircle, Bell } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import BookingModal from '@/components/BookingModal'
import MessagingSystem from '@/components/MessagingSystem'
import NotificationSystem from '@/components/NotificationSystem'

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
  const [selectedClass, setSele‌ctedClass] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  // Move modal state to parent component to prevent reset
  const [isModalSignUp, setIsModalSignUp] = useState(false)
  const [modalEmail, setModalEmail] = useState('')
  const [modalPassword, setModalPassword] = useState('')
  const [modalName, setModalName] = useState('')
  const [modalShowPassword, setModalShowPassword] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
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

  // Mock data for trending classes
  const trendingClasses = [
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
      location: "Downtown",
      description: "An energizing flow class that builds strength and flexibility",
      rating: "4.9"
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
      location: "Midtown",
      description: "High-intensity interval training for maximum calorie burn",
      rating: "4.8"
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
      location: "Uptown",
      description: "Precision movement on the reformer for core strength",
      rating: "4.9"
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
      location: "Brooklyn",
      description: "Learn proper boxing technique in a supportive environment",
      rating: "4.7"
    },
    {
      id: 5,
      title: "Aerial Yoga",
      instructor: "Luna Rodriguez",
      studio: "Sky Studio",
      time: "10:00 AM",
      date: "Tomorrow",
      price: "$38",
      image: LIFESTYLE_IMAGES[0],
      type: "Aerial",
      capacity: 12,
      booked: 6,
      duration: 75,
      location: "SoHo",
      description: "Experience weightless yoga with silk hammocks",
      rating: "4.8"
    },
    {
      id: 6,
      title: "Spin & Strength",
      instructor: "Carlos Martinez",
      studio: "Cycle Elite",
      time: "7:30 AM",
      date: "Tomorrow",
      price: "$32",
      image: LIFESTYLE_IMAGES[1],
      type: "Spin",
      capacity: 25,
      booked: 22,
      duration: 50,
      location: "Financial District",
      description: "High-energy cycling combined with strength training",
      rating: "4.9"
    }
  ]

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
    const handleSubmit = async (e) => {
      e.preventDefault()
      setModalLoading(true)

      try {
        // Add validation
        if (!modalEmail || !modalPassword) {
          toast.error('Please fill in all required fields')
          setModalLoading(false)
          return
        }

        if (isModalSignUp && !modalName) {
          toast.error('Please enter your full name')
          setModalLoading(false)
          return
        }

        if (isModalSignUp) {
          // Sign up logic - redirect to role selection
          console.log('Processing sign up for:', { name: modalName, email: modalEmail })
          toast.success('Account created successfully!')
          setShowSignInModal(false)
          
          // Reset modal state
          setIsModalSignUp(false)
          setModalEmail('')
          setModalPassword('')
          setModalName('')
          
          // Use a small delay to ensure modal closes before redirect
          setTimeout(() => {
            window.location.href = '/signup/role-selection'
          }, 500)
        } else {
          // Sign in logic - check if user exists, redirect to appropriate dashboard
          console.log('Processing sign in for:', { email: modalEmail })
          toast.success('Signed in successfully!')
          setShowSignInModal(false)
          
          // Reset modal state
          setIsModalSignUp(false)
          setModalEmail('')
          setModalPassword('')
          setModalName('')
          
          // Use a small delay to ensure modal closes before redirect
          setTimeout(() => {
            window.location.href = '/dashboard/customer'
          }, 500)
        }
      } catch (error) {
        console.error('Authentication error:', error)
        toast.error('Authentication failed. Please try again.')
        setModalLoading(false)
      }
    }

    if (!showSignInModal) return null

    return (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 modal-backdrop"
        onTouchStart={(e) => {
          // Prevent backdrop from interfering with input focus
          if (e.target === e.currentTarget) {
            e.preventDefault()
          }
        }}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto relative modal-container modal-content">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-[#1C1C1E]">
                  {isModalSignUp ? 'Join Thryve' : 'Welcome Back'}
                </h2>
                <p className="text-[#7A7A7A] mt-1">
                  {isModalSignUp ? 'Create your account to get started' : 'Sign in to your account'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSignInModal(false)
                  // Reset modal state when closing
                  setIsModalSignUp(false)
                  setModalEmail('')
                  setModalPassword('')
                  setModalName('')
                }}
                className="p-2 hover:bg-[#EADBC8]/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[#7A7A7A]" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {isModalSignUp && (
                <div>
                  <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-white border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors"
                    placeholder="Enter your full name"
                    required={isModalSignUp}
                    autoComplete="name"
                    inputMode="text"
                    onFocus={(e) => {
                      // Aggressive mobile focus retention
                      setTimeout(() => {
                        e.target.focus()
                        e.target.click()
                      }, 100)
                    }}
                    onBlur={(e) => {
                      // Prevent unwanted blur on mobile
                      if (document.activeElement !== e.target) {
                        setTimeout(() => {
                          e.target.focus()
                        }, 10)
                      }
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation()
                      e.target.focus()
                    }}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full px-4 py-3 text-base bg-white border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors"
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  // Mobile-specific attributes
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  // Aggressive focus handlers
                  onTouchStart={(e) => {
                    e.stopPropagation()
                    // Force focus immediately
                    e.target.focus()
                    e.target.setAttribute('readonly', false)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // Double-ensure focus
                    setTimeout(() => {
                      e.target.focus()
                      e.target.click()
                    }, 0)
                  }}
                  onFocus={(e) => {
                    // Remove readonly on focus
                    e.target.removeAttribute('readonly')
                    // Prevent modal shifting
                    e.target.scrollIntoView({ 
                      block: 'center', 
                      behavior: 'smooth',
                      inline: 'nearest'
                    })
                  }}
                  onBlur={(e) => {
                    // Only allow blur if user is tapping submit or another input
                    const relatedTarget = e.relatedTarget
                    if (!relatedTarget || (relatedTarget.tagName !== 'BUTTON' && relatedTarget.tagName !== 'INPUT')) {
                      setTimeout(() => {
                        if (document.activeElement !== e.target) {
                          e.target.focus()
                        }
                      }, 50)
                    }
                  }}
                  // Add readonly initially to prevent iOS keyboard issues, remove on touch
                  readOnly={false}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1C1C1E] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={modalShowPassword ? 'text' : 'password'}
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    className="w-full px-4 py-3 text-base bg-white border border-[#EADBC8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E90FF]/20 focus:border-[#1E90FF] transition-colors pr-12"
                    placeholder="Enter your password"
                    required
                    autoComplete={isModalSignUp ? "new-password" : "current-password"}
                    inputMode="text"
                    onFocus={(e) => {
                      // Aggressive mobile focus retention for password
                      setTimeout(() => {
                        e.target.focus()
                        e.target.click()
                      }, 100)
                    }}
                    onBlur={(e) => {
                      // Prevent unwanted blur on mobile for password
                      if (document.activeElement !== e.target && e.relatedTarget?.tagName !== 'BUTTON') {
                        setTimeout(() => {
                          e.target.focus()
                        }, 10)
                      }
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation()
                      e.target.focus()
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      e.target.focus()
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setModalShowPassword(!modalShowPassword)}
                    onTouchStart={(e) => {
                      e.stopPropagation()
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#7A7A7A] hover:text-[#1C1C1E] transition-colors"
                  >
                    {modalShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {!isModalSignUp && (
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
                disabled={modalLoading}
                className="w-full bg-[#1E90FF] hover:bg-[#1976D2] text-white py-3 rounded-xl font-semibold text-lg touch-manipulation"
              >
                {modalLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  isModalSignUp ? 'Create Account' : 'Sign In'
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="mt-4 md:mt-6 text-center">
              <p className="text-[#7A7A7A]">
                {isModalSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsModalSignUp(!isModalSignUp)}
                  className="text-[#1E90FF] hover:underline font-medium touch-manipulation"
                >
                  {isModalSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-4 md:mt-6 flex items-center">
              <div className="flex-1 border-t border-[#EADBC8]"></div>
              <span className="px-4 text-sm text-[#7A7A7A]">or</span>
              <div className="flex-1 border-t border-[#EADBC8]"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="mt-4 md:mt-6 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#EADBC8] text-[#1C1C1E] hover:bg-[#EADBC8]/10 py-3 rounded-xl font-medium touch-manipulation"
              >
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#EADBC8] text-[#1C1C1E] hover:bg-[#EADBC8]/10 py-3 rounded-xl font-medium touch-manipulation"
              >
                Continue with Apple
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
              <Link href="/marketplace" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
                Explore
              </Link>
              <Link href="/xpass-purchase" className="text-white/80 hover:text-white transition-colors font-medium smooth-transition">
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
                <>
                  {/* Communication Icons */}
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 p-2 rounded-full"
                    onClick={() => setShowMessaging(true)}
                    title="Messages"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/10 p-2 rounded-full relative"
                    onClick={() => setShowNotifications(true)}
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {/* Notification badge could be added here */}
                  </Button>
                  <Link href="/dashboard">
                    <Button className="btn-modern bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-full border border-white/30">
                      Dashboard
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 btn-modern"
                    onClick={() => setShowSignInModal(true)}
                  >
                    Sign In
                  </Button>
                  <Link href="/signup">
                    <Button className="btn-modern bg-white text-black hover:bg-white/90 px-6 py-2 rounded-full font-semibold">
                      Get Started
                    </Button>
                  </Link>
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
        <div className="relative z-30 text-center text-white px-6 max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
              <span className="text-white/90 text-sm font-medium">✨ Join 50,000+ fitness enthusiasts</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight">
            Train. Book.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Thrive.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-4xl mx-auto leading-relaxed font-medium">
            The future of fitness is here. Book classes, manage your studio, and connect with your community — all in one stunning platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/marketplace">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                Book a Class
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-slate-900 px-10 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:scale-105"
              onClick={() => setShowSignInModal(true)}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>Secure payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span>50k+ members</span>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/70 rounded-full mt-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Design */}
      <section className="py-32 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-100/50 mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-sm font-bold">
                ✨ Why choose Thryve?
              </span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              Built for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Champions
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              The only platform that puts your success first. Zero hidden fees, maximum results.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group">
              <div className="relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-blue-100 hover:-translate-y-2">
                <div className="absolute -top-4 left-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">3.75% Fee</h3>
                  <p className="text-slate-600 leading-relaxed">
                    That's it. No hidden costs, no monthly fees, no surprises. Simple pricing that works.
                  </p>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-emerald-100 hover:-translate-y-2">
                <div className="absolute -top-4 left-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Zero Monthly</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Pay only when you earn. No subscriptions, no commitments. Pure performance pricing.
                  </p>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-purple-100 hover:-translate-y-2">
                <div className="absolute -top-4 left-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Your Brand</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Keep your customers, build your community, grow your brand. We amplify, never replace.
                  </p>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="relative p-8 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 hover:border-orange-100 hover:-translate-y-2">
                <div className="absolute -top-4 left-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Bot className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="pt-8">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Setup</h3>
                  <p className="text-slate-600 leading-relaxed">
                    From zero to hero in minutes. AI-powered onboarding gets you live instantly.
                  </p>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Classes - Modern Feed */}
      <section className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-100/50 mb-8">
              <TrendingUp className="w-4 h-4 text-purple-600 mr-2" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-bold">
                Live Discovery Feed
              </span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              Trending{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Classes
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Join thousands discovering their next favorite workout. Real-time, authentic, unstoppable.
            </p>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingClasses.slice(0, 6).map((classItem, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
                  {/* Class Image */}
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={classItem.image} 
                      alt={classItem.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="bg-white/20 backdrop-blur text-white border-white/30">
                        {classItem.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{classItem.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-1">{classItem.title}</h3>
                    <p className="text-white/80 text-sm mb-3">{classItem.studio}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-white/70">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{classItem.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{classItem.location}</span>
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="bg-white text-slate-900 hover:bg-white/90 font-semibold"
                        onClick={() => {
                          setSelectedClass(classItem)
                          setShowBookingModal(true)
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                  
                  {/* Live Indicator */}
                  {index < 3 && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-2 px-3 py-1 bg-red-500 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-white text-xs font-bold">LIVE</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* View More Button */}
          <div className="text-center mt-16">
            <Link href="/marketplace">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                Explore All Classes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Modern Design */}
      <section className="py-32 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.3'%3E%3Cpath d='M0 40h80v1H0zM40 0v80h1V0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-full border border-emerald-100/50 mb-8">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600 text-sm font-bold">
                ⚡ Simple Process
              </span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              How It{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600">
                Works
              </span>
            </h2>
            
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Two paths, one destination: success. Whether you're a studio owner or a fitness enthusiast.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* For Studios */}
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border border-purple-200/50 mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-lg font-bold">
                    For Studios
                  </span>
                </div>
                <p className="text-slate-600">Monetize your passion effortlessly</p>
              </div>
              
              <div className="space-y-8">
                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✨</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">
                      Create Your Profile
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Upload your studio details, photos, and amenities in minutes with our AI assistant
                    </p>
                  </div>
                </div>

                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      2
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🚀</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                      Upload Classes
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Add your class schedule instantly with our AI-powered import tool
                    </p>
                  </div>
                </div>

                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      3
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-pink-400 to-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💰</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-emerald-600 transition-colors">
                      Get Bookings
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Start receiving bookings immediately with instant payouts at just 3.75%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Users */}
            <div className="relative">
              <div className="text-center mb-12">
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl border border-blue-200/50 mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-lg font-bold">
                    For Users
                  </span>
                </div>
                <p className="text-slate-600">Your fitness journey simplified</p>
              </div>
              
              <div className="space-y-8">
                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🔍</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                      Browse Classes
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Discover amazing classes near you with personalized recommendations
                    </p>
                  </div>
                </div>

                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      2
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-pink-600 transition-colors">
                      Book Instantly
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Secure your spot with one click, complete with secure payment processing
                    </p>
                  </div>
                </div>

                <div className="group flex items-start space-x-6 p-6 bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-100">
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-xl">
                      3
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">💪</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-black text-2xl text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      Show Up & Thrive
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg">
                      Focus on your workout while we handle the rest of your fitness journey
                    </p>
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
                  <li><Link href="/marketplace" className="hover:text-white smooth-transition hover:translate-x-2 block">Explore Classes</Link></li>
                  <li><Link href="/xpass-purchase" className="hover:text-white smooth-transition hover:translate-x-2 block">X Pass</Link></li>
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

      {/* Communication Components */}
      <MessagingSystem 
        isOpen={showMessaging}
        onClose={() => setShowMessaging(false)}
      />
      
      <NotificationSystem 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Floating Communication Button - Only show when user is logged in */}
      {user && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="flex flex-col space-y-3">
            <Button
              className="w-14 h-14 rounded-full bg-[#1E90FF] hover:bg-[#1976D2] text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              onClick={() => setShowNotifications(true)}
              title="Open Notifications"
            >
              <Bell className="h-6 w-6" />
            </Button>
            <Button
              className="w-14 h-14 rounded-full bg-[#1E90FF] hover:bg-[#1976D2] text-white shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
              onClick={() => setShowMessaging(true)}
              title="Open Messages"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        classData={selectedClass}
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
          setSelectedClass(null)
        }}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  )
}