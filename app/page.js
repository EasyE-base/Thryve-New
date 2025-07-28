'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Play, Calendar, Users, TrendingUp, Star, CheckCircle, MapPin, Clock, ChevronLeft, ChevronRight, Award, Zap, Shield, Bot, Infinity, X, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Premium fitness images from vision expert
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1651340048718-6185c00f1833?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2xhc3Nlc3xlbnwwfHx8YmxhY2tfYW5kX3doaXRlfDE3NTM3Mzk2MjV8MA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1602611001078-4512cf999d27?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzZ8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2xhc3Nlc3xlbnwwfHx8YmxhY2tfYW5kX3doaXRlfDE3NTM3Mzk2MjV8MA&ixlib=rb-4.1.0&q=85",
  "https://images.pexels.com/photos/4587290/pexels-photo-4587290.jpeg"
]

const LIFESTYLE_IMAGES = [
  "https://images.unsplash.com/photo-1593810451056-0acc1fad48c5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1598596583430-c81c94b52dad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHx5b2dhJTIwc3R1ZGlvfGVufDB8fHxibGFja19hbmRfd2hpdGV8MTc1MzczOTYzMXww&ixlib=rb-4.1.0&q=85"
]

const INSTRUCTOR_IMAGE = "https://images.unsplash.com/photo-1616279969096-54b228f5f103?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxmaXRuZXNzJTIwaW5zdHJ1Y3RvcnxlbnwwfHx8fDE3NTM3Mzk2NzB8MA&ixlib=rb-4.1.0&q=85"

const GYM_INTERIOR = "https://images.unsplash.com/photo-1542766788-a2f588f447ee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxneW0lMjBpbnRlcmlvcnxlbnwwfHx8fDE3NTM3MTM0NDB8MA&ixlib=rb-4.1.0&q=85"

export default function Home() {
  const { user, role } = useAuth()
  const [currentHeroImage, setCurrentHeroImage] = useState(0)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const heroRef = useRef(null)

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  // Mock data for live classes
  const liveClasses = [
    {
      id: 1,
      title: "Power Vinyasa Flow",
      instructor: "Maya Chen",
      studio: "Zen Flow Studio",
      time: "7:00 AM",
      price: "$28",
      image: LIFESTYLE_IMAGES[0],
      type: "Yoga"
    },
    {
      id: 2,
      title: "HIIT Bootcamp",
      instructor: "Marcus Williams",
      studio: "Strength Labs",
      time: "6:30 PM",
      price: "$35",
      image: HERO_IMAGES[1],
      type: "HIIT"
    },
    {
      id: 3,
      title: "Pilates Reformer",
      instructor: "Sarah Johnson",
      studio: "Core Studio",
      time: "12:00 PM",
      price: "$42",
      image: LIFESTYLE_IMAGES[1],
      type: "Pilates"
    },
    {
      id: 4,
      title: "Boxing Fundamentals",
      instructor: "Diego Rivera",
      studio: "Fight Club NYC",
      time: "8:00 PM",
      price: "$30",
      image: HERO_IMAGES[2],
      type: "Boxing"
    }
  ]

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

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EADBC8]/30 transition-all duration-300">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-[#1C1C1E]">
              Thryve
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/explore" className="text-[#7A7A7A] hover:text-[#1E90FF] transition-colors font-medium">
                Explore
              </Link>
              <Link href="/xpass" className="text-[#7A7A7A] hover:text-[#1E90FF] transition-colors font-medium">
                X Pass
              </Link>
              <Link href="/pricing" className="text-[#7A7A7A] hover:text-[#1E90FF] transition-colors font-medium">
                Pricing
              </Link>
              <Link href="/about" className="text-[#7A7A7A] hover:text-[#1E90FF] transition-colors font-medium">
                About
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-[#1E90FF] hover:bg-[#1976D2] text-white px-6 py-2 rounded-full">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Button variant="ghost" className="text-[#1C1C1E] hover:bg-[#EADBC8]/50">
                    Sign In
                  </Button>
                  <Button className="bg-[#1E90FF] hover:bg-[#1976D2] text-white px-6 py-2 rounded-full">
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
        {/* Background Image with Parallax */}
        <div className="absolute inset-0">
          <div className="relative w-full h-full">
            <img 
              src={HERO_IMAGES[currentHeroImage]} 
              alt="Fitness Hero"
              className="w-full h-full object-cover transition-all duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1C1C1E]/80 via-[#1C1C1E]/60 to-transparent"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center text-white px-6 max-w-5xl mx-auto">
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
            <Link href="/onboarding">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1C1C1E] px-8 py-4 rounded-full text-lg font-semibold">
                Studio? Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#1C1C1E] mb-6">Why Thryve?</h2>
            <p className="text-xl text-[#7A7A7A] max-w-3xl mx-auto">
              Built for studios, loved by customers. The only platform that truly puts your business first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-[#1E90FF]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#1E90FF]/20 transition-colors">
                <Zap className="h-10 w-10 text-[#1E90FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1E] mb-3">Flat 3.75% fee</h3>
              <p className="text-[#7A7A7A]">That's it. No hidden costs, no surprises.</p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-[#1E90FF]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#1E90FF]/20 transition-colors">
                <Shield className="h-10 w-10 text-[#1E90FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1E] mb-3">No Monthly Costs</h3>
              <p className="text-[#7A7A7A]">Pay only when you earn. Zero subscription fees.</p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-[#1E90FF]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#1E90FF]/20 transition-colors">
                <Award className="h-10 w-10 text-[#1E90FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1E] mb-3">Your Brand First</h3>
              <p className="text-[#7A7A7A]">Keep your customers. Build your community.</p>
            </div>

            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="bg-[#1E90FF]/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#1E90FF]/20 transition-colors">
                <Bot className="h-10 w-10 text-[#1E90FF]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1C1E] mb-3">AI Onboarding</h3>
              <p className="text-[#7A7A7A]">From Mindbody to live in minutes, not months.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Discovery Feed */}
      <section className="py-24 bg-[#FAF9F6]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#1C1C1E] mb-6">Trending Classes</h2>
            <p className="text-xl text-[#7A7A7A]">Join thousands discovering their next favorite workout</p>
          </div>

          <div className="relative">
            <div className="flex overflow-x-auto space-x-6 pb-6 scrollbar-hide">
              {liveClasses.map((classItem) => (
                <div key={classItem.id} className="flex-shrink-0 w-80 group">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="relative">
                      <img 
                        src={classItem.image} 
                        alt={classItem.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#1E90FF] text-white">
                          {classItem.type}
                        </Badge>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full">
                        <span className="text-[#1C1C1E] font-bold">{classItem.price}</span>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="font-bold text-xl text-[#1C1C1E] mb-2">{classItem.title}</h3>
                      <p className="text-[#7A7A7A] mb-1">with {classItem.instructor}</p>
                      <p className="text-[#7A7A7A] mb-3">{classItem.studio}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-[#7A7A7A]">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{classItem.time}</span>
                        </div>
                        <Button size="sm" className="bg-[#1E90FF] hover:bg-[#1976D2] text-white">
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
      <footer className="bg-[#1C1C1E] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-3xl font-bold mb-6">Thryve</div>
              <p className="text-gray-400 mb-6">
                The future of wellness booking & management. Built for studios, loved by everyone.
              </p>
              <div className="flex space-x-4">
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.887 2.747.099.119.112.223.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.162-1.499-.69-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z."/>
                  </svg>
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Platform</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Classes</Link></li>
                <li><Link href="/xpass" className="hover:text-white transition-colors">X Pass</Link></li>
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Find Instructors</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Support</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/help-center" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact-us" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-lg">Legal</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
            <p>&copy; 2024 Thryve. All rights reserved.</p>
            <p>Built with love for the wellness community.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}