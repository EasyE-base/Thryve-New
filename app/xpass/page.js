'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Check, Star, MapPin, Clock, Users, Zap, Award, Infinity, 
  TrendingUp, Shield, ChevronRight, ChevronDown, Play,
  Network, Heart, Calendar, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function XPassPage() {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState('unlimited')
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  // Featured Classes Data
  const FEATURED_CLASSES = [
    {
      id: 1,
      title: "Power Vinyasa Flow",
      studio: "Zen Flow Studio",
      instructor: "Sarah Chen",
      rating: 4.9,
      reviews: 124,
      location: "Downtown",
      time: "7:00 AM",
      duration: 60,
      difficulty: "Intermediate",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb07659d?w=600&h=400&fit=crop",
      tags: ["Vinyasa", "Morning", "Flexibility"]
    },
    {
      id: 2,
      title: "HIIT Strength",
      studio: "Energy Fitness",
      instructor: "Marcus Rodriguez",
      rating: 4.8,
      reviews: 89,
      location: "Midtown",
      time: "6:00 PM",
      duration: 45,
      difficulty: "Advanced",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
      tags: ["HIIT", "Strength", "Evening"]
    },
    {
      id: 3,
      title: "Reformer Pilates",
      studio: "Core Balance",
      instructor: "Emma Wilson",
      rating: 4.9,
      reviews: 156,
      location: "Uptown",
      time: "10:00 AM",
      duration: 50,
      difficulty: "All Levels",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop",
      tags: ["Pilates", "Core", "Equipment"]
    },
    {
      id: 4,
      title: "Dance Cardio",
      studio: "Movement Lab",
      instructor: "Isabella Torres",
      rating: 4.7,
      reviews: 78,
      location: "Arts District",
      time: "7:30 PM",
      duration: 55,
      difficulty: "Beginner",
      image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop",
      tags: ["Dance", "Cardio", "Fun"]
    }
  ]

  // Studio Partners
  const STUDIO_PARTNERS = [
    { name: "Zen Flow Studio", logo: "ZF" },
    { name: "Energy Fitness", logo: "EF" },
    { name: "Core Balance", logo: "CB" },
    { name: "Movement Lab", logo: "ML" },
    { name: "Strength Co", logo: "SC" },
    { name: "Yoga Collective", logo: "YC" },
    { name: "Pulse Studios", logo: "PS" },
    { name: "Flex Fitness", logo: "FF" }
  ]

  // FAQ Data
  const FAQ_DATA = [
    {
      question: "How much does X Pass cost?",
      answer: "X Pass starts at $149/month for 8 classes or $199/month for unlimited access to our entire network of premium studios."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! You can cancel your X Pass membership at any time with no cancellation fees. Your access continues until the end of your current billing cycle."
    },
    {
      question: "Do credits rollover?",
      answer: "Unused credits from your monthly plan rollover for up to 2 months, giving you flexibility to use them when it works best for you."
    },
    {
      question: "Which studios are included?",
      answer: "X Pass gives you access to 500+ premium studios nationwide, including yoga, pilates, HIIT, cycling, and specialty fitness studios."
    },
    {
      question: "How do I book classes?",
      answer: "Simply browse classes in the Thryve app or website, and book with your X Pass credits. No additional fees per class."
    }
  ]

  const benefits = [
    {
      icon: Network,
      title: "One Network Pass",
      description: "Access 500+ studios with a single membership"
    },
    {
      icon: Award,
      title: "Earn Loyalty",
      description: "Build rewards and unlock exclusive perks"
    },
    {
      icon: Star,
      title: "Top-Rated Studios",
      description: "Only premium, highly-rated fitness partners"
    },
    {
      icon: Calendar,
      title: "Flex Scheduling",
      description: "Book, reschedule, or cancel with ease"
    }
  ]

  const steps = [
    {
      number: "01",
      title: "Browse Across Studios",
      description: "Explore classes from hundreds of premium studios in your area"
    },
    {
      number: "02", 
      title: "Book with X Pass Credits",
      description: "Use your monthly credits to reserve spots in any participating studio"
    },
    {
      number: "03",
      title: "Attend Anywhere",
      description: "Show up and enjoy world-class fitness experiences across the network"
    }
  ]

  const handleJoinPass = () => {
    if (!user) {
      toast.info("Sign up to join X Pass!")
      return
    }
    toast.success("Welcome to X Pass! Let's get started 🎉")
  }

  const handleBookClass = (classItem) => {
    if (!user) {
      toast.info("Sign up to book with X Pass!")
      return
    }
    toast.success(`Booking ${classItem.title} with X Pass credits!`)
  }

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % FEATURED_CLASSES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Sage-Green Accent Stripe */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 to-teal-600"></div>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-900">Thryve</h1>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/explore" className="text-gray-600 hover:text-emerald-600 transition-colors">Explore</Link>
              <Link href="/studios" className="text-gray-600 hover:text-emerald-600 transition-colors">Studios</Link>
              <Link href="/xpass" className="text-emerald-600 font-medium">X Pass</Link>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-600 hover:text-emerald-600">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-gray-50 to-emerald-50 py-20 overflow-hidden">
        {/* Background Shapes */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-teal-600 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              FIND YOUR X FACTOR<br />
              <span className="text-emerald-600">WITH THRYVE X PASS</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Unlock tens of thousands of workouts nationwide<br />
              with one flexible membership.
            </p>
            <Button 
              onClick={handleJoinPass}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              View Plans
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg group">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                    <benefit.icon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-12 h-px bg-emerald-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Classes Slider */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Classes</h2>
            <p className="text-xl text-gray-600">Premium classes available with X Pass</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_CLASSES.map((classItem, index) => (
              <Card key={classItem.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative overflow-hidden">
                  <img 
                    src={classItem.image} 
                    alt={classItem.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Button 
                    onClick={() => handleBookClass(classItem)}
                    className="absolute bottom-4 right-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  >
                    Book with X Pass
                  </Button>
                  <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </button>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 ml-1">{classItem.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{classItem.studio}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-3">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {classItem.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {classItem.time}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {classItem.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Recommended Section (for logged-in users) */}
      {user && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3 mb-12">
              <Sparkles className="w-8 h-8 text-emerald-600" />
              <h2 className="text-4xl font-bold text-gray-900">Recommended For You</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_CLASSES.slice(0, 3).map((classItem) => (
                <Card key={`rec-${classItem.id}`} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="flex">
                    <img 
                      src={classItem.image} 
                      alt={classItem.title}
                      className="w-24 h-24 object-cover"
                    />
                    <CardContent className="flex-1 p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{classItem.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{classItem.studio}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {classItem.time}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleBookClass(classItem)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1"
                        >
                          Book
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Studio Partners */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Studios Participating in X Pass</h2>
            <p className="text-xl text-gray-600">Join a network of premium fitness partners</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8">
            {STUDIO_PARTNERS.map((studio, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors duration-300">
                  <span className="text-xl font-bold text-gray-600 group-hover:text-emerald-600">{studio.logo}</span>
                </div>
                <p className="text-sm text-gray-600 text-center mt-2 group-hover:text-emerald-600 transition-colors">{studio.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know about X Pass</p>
          </div>
          
          <div className="space-y-4">
            {FAQ_DATA.map((faq, index) => (
              <Card key={index} className="border-emerald-200">
                <CardContent className="p-0">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expandedFaq === index ? 'transform rotate-180' : ''}`} />
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Fitness Journey?</h2>
          <p className="text-xl text-emerald-100 mb-8">Join thousands of members already using X Pass</p>
          <Button 
            onClick={handleJoinPass}
            className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            Join X Pass Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">Thryve</h3>
              <p className="text-gray-400">Discover your next fitness obsession.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/explore" className="hover:text-emerald-400 transition-colors">Explore Classes</Link></li>
                <li><Link href="/studios" className="hover:text-emerald-400 transition-colors">Partner Studios</Link></li>
                <li><Link href="/xpass" className="hover:text-emerald-400 transition-colors">X Pass</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/community" className="hover:text-emerald-400 transition-colors">Community</Link></li>
                <li><Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link></li>
                <li><Link href="/events" className="hover:text-emerald-400 transition-colors">Events</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-emerald-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Thryve. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}