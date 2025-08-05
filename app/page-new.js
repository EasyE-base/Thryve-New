'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLandingState } from '@/hooks/useLandingState'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Bell, MessageCircle, ArrowRight, X, Eye, EyeOff, Star, Shield, Users, Zap, Award, Bot, Infinity, TrendingUp } from 'lucide-react'
import { signUp, signIn, getUserRole } from '@/lib/firebase-auth'
import Link from 'next/link'
import LandingNavigation from '@/components/landing/LandingNavigation'
import HeroSection from '@/components/landing/HeroSection'
import TrendingClasses from '@/components/landing/TrendingClasses'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import SuccessStatsSection from '@/components/landing/SuccessStatsSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import CTASection from '@/components/landing/CTASection'
import SignInModal from '@/components/landing/SignInModal'
import BookingModal from '@/components/BookingModal'
import MessagingSystem from '@/components/MessagingSystem'
import NotificationSystem from '@/components/NotificationSystem'

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

export default function Home() {
  const { user, role } = useAuth()
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showMessaging, setShowMessaging] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  const [isModalSignUp, setIsModalSignUp] = useState(false)
  const [modalEmail, setModalEmail] = useState('')
  const [modalPassword, setModalPassword] = useState('')
  const [modalName, setModalName] = useState('')
  const [modalShowPassword, setModalShowPassword] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  
  const heroRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % HERO_VIDEOS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

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
    toast.success('Booking successful!')
    setShowBookingModal(false)
    setSelectedClass(null)
  }

  const testimonials = [
    {
      quote: "Thryve completely transformed how I manage my studio.",
      name: "Elena Rodriguez",
      title: "Owner, Luna Yoga Studio",
      image: INSTRUCTOR_IMAGE
    },
    {
      quote: "Finally, a platform that puts studios first.",
      name: "Michael Chen",
      title: "Founder, Peak Performance",
      image: INSTRUCTOR_IMAGE
    }
  ]

  const SignInModal = () => {
    const handleSubmit = async (e) => {
      e.preventDefault()
      setModalLoading(true)
      try {
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
          const result = await signUp(modalEmail, modalPassword)
          if (result.success) {
            toast.success('Account created successfully!')
            setShowSignInModal(false)
            setIsModalSignUp(false)
            setModalEmail('')
            setModalPassword('')
            setModalName('')
          } else {
            toast.error(result.error || 'Sign up failed.')
          }
        } else {
          const result = await signIn(modalEmail, modalPassword)
          if (result.success) {
            toast.success('Welcome back!')
            setShowSignInModal(false)
            setIsModalSignUp(false)
            setModalEmail('')
            setModalPassword('')
            setModalName('')
          } else {
            toast.error(result.error || 'Sign in failed.')
          }
        }
      } catch (error) {
        toast.error('An error occurred.')
      } finally {
        setModalLoading(false)
      }
    }

    return (
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showSignInModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
          <button onClick={() => setShowSignInModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isModalSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isModalSignUp ? 'Join the Thryve community' : 'Sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isModalSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" value={modalName} onChange={(e) => setModalName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" required={isModalSignUp} />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input type="email" value={modalEmail} onChange={(e) => setModalEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your email" required />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={modalShowPassword ? 'text' : 'password'} value={modalPassword} onChange={(e) => setModalPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-12" placeholder="Enter your password" required />
                <button type="button" onClick={() => setModalShowPassword(!modalShowPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {modalShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={modalLoading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {modalLoading ? 'Processing...' : (isModalSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => setIsModalSignUp(!isModalSignUp)} className="text-blue-600 hover:text-blue-700 font-medium">
              {isModalSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Thryve</h1>
              </div>
              <div className="hidden md:block ml-10">
                <div className="flex items-baseline space-x-4">
                  <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
                  <Link href="/about" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">About</Link>
                  <Link href="/pricing" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</Link>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button onClick={() => setShowNotifications(!showNotifications)} className="text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100">
                    <Bell className="w-5 h-5" />
                  </button>
                  <Link href={role === 'merchant' ? '/dashboard' : '/instructor'}>
                    <Button className="bg-blue-600 hover:bg-blue-700">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <Button onClick={() => setShowSignInModal(true)} className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section ref={heroRef} className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Transform Your<span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Fitness Studio</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-lg">
                The all-in-one platform for fitness studios. Manage classes, bookings, payments, and grow your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button onClick={() => setShowSignInModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">Start Free Trial</Button>
                <Button variant="outline" className="px-8 py-3 text-lg">Watch Demo</Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Platform Demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Built specifically for fitness studios with features that save time and increase revenue.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Class Management", description: "Schedule classes and manage instructors", icon: "📅" },
              { title: "Online Booking", description: "Let clients book classes anytime", icon: "📱" },
              { title: "Payment Processing", description: "Secure payments with competitive rates", icon: "💳" }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: "Studios Powered", value: "500+" },
              { label: "Classes Booked", value: "50K+" },
              { label: "Happy Clients", value: "25K+" },
              { label: "Revenue Processed", value: "$2M+" }
            ].map((stat, index) => (
              <div key={index} className="text-white">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-blue-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Transform Your Studio?</h2>
          <p className="text-xl text-gray-600 mb-8">Join thousands of studio owners who have grown their business with Thryve.</p>
          <Button onClick={() => setShowSignInModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">Start Your Free Trial</Button>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Thryve</h3>
              <p className="text-gray-400">The complete fitness studio management platform.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 Thryve. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <SignInModal />
      
      {showBookingModal && (
        <BookingModal
          classData={selectedClass}
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
      
      {showMessaging && (
        <MessagingSystem
          onClose={() => setShowMessaging(false)}
        />
      )}
      
      {showNotifications && (
        <NotificationSystem
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
} 