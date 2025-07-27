'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight, 
  Star, 
  Users, 
  Calendar,
  MapPin,
  Smartphone,
  Heart,
  Play,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  Target,
  Trophy,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LandingPage() {
  const { user, signUp, signIn, signOut } = useAuth()
  const [authMode, setAuthMode] = useState(null) // null, 'signin', 'signup', 'role-select'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roleSelecting, setRoleSelecting] = useState(false)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [currentFeature, setCurrentFeature] = useState(0)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const router = useRouter()
  const heroRef = useRef(null)
  const featuresRef = useRef(null)

  // Auto-rotate testimonials and features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length)
      setCurrentFeature(prev => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeInUp')
          }
        })
      },
      { threshold: 0.1 }
    )

    const elements = document.querySelectorAll('.animate-on-scroll')
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Yoga Enthusiast",
      content: "Thryve completely changed how I approach fitness. The instructors are incredible and the app is so easy to use!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1494790108755-2616b332c1b6?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Mike K.",
      role: "HIIT Regular",
      content: "Best fitness platform I've ever used. The variety of classes and quality of instruction is unmatched.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
    },
    {
      name: "Emma L.",
      role: "Fitness Newcomer",
      content: "I was intimidated by fitness classes, but Thryve made it so welcoming. Now I'm addicted to working out!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
    }
  ]

  const features = [
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Scheduling",
      description: "AI-powered class recommendations that fit your schedule perfectly"
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Expert Instructors",
      description: "Hand-picked certified trainers with years of experience"
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "Mobile-First",
      description: "Designed for mobile with intuitive swipe navigation"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Community Driven",
      description: "Connect with like-minded fitness enthusiasts in your area"
    }
  ]

  const stats = [
    { label: "Active Members", value: "10K+", icon: <Users className="h-6 w-6" /> },
    { label: "Classes Completed", value: "50K+", icon: <Trophy className="h-6 w-6" /> },
    { label: "Expert Instructors", value: "500+", icon: <Star className="h-6 w-6" /> },
    { label: "Cities", value: "25+", icon: <MapPin className="h-6 w-6" /> }
  ]

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (loading) return

    const { email, password, confirmPassword } = formData

    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      if (authMode === 'signup') {
        const result = await signUp(email, password)
        if (result.success) {
          setAuthMode('role-select')
          toast.success('Account created successfully!')
        } else {
          toast.error(result.error || 'Failed to create account')
        }
      } else {
        const result = await signIn(email, password)
        if (result.success) {
          toast.success('Welcome back!')
          setTimeout(() => {
            router.push('/dashboard/customer')
          }, 1000)
        } else {
          toast.error(result.error || 'Failed to sign in')
        }
      }
    } catch (error) {
      toast.error('Authentication error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = async (role) => {
    if (!user || roleSelecting) return

    setRoleSelecting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/auth/firebase-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role
        })
      })

      if (response.ok) {
        localStorage.setItem('userRole', role)
        localStorage.setItem('onboardingComplete', 'false')
        
        toast.success(`Welcome to Thryve as a ${role}!`)
        
        setTimeout(() => {
          router.push(`/onboarding/${role}`)
        }, 1000)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set role')
      }
    } catch (error) {
      toast.error(error.message || 'Failed to select role')
      
      // Fallback for 502 errors
      localStorage.setItem('userRole', role)
      localStorage.setItem('onboardingComplete', 'false')
      
      setTimeout(() => {
        router.push(`/onboarding/${role}`)
      }, 2000)
    } finally {
      setRoleSelecting(false)
    }
  }

  if (user && authMode === 'role-select') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card-modern w-full max-w-2xl">
          <CardHeader className="text-center pb-8">
            <div className="animate-pulse-glow mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold text-gradient mb-4">
              Choose Your Journey
            </CardTitle>
            <p className="text-blue-200">Select your role to personalize your Thryve experience</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { role: 'customer', title: 'Fitness Enthusiast', desc: 'Book classes, track progress, achieve goals', icon: <Heart /> },
                { role: 'instructor', title: 'Fitness Instructor', desc: 'Teach classes, build community, earn income', icon: <Zap /> },
                { role: 'merchant', title: 'Studio Owner', desc: 'Manage studio, instructors, and bookings', icon: <Target /> }
              ].map((option, index) => (
                <Button
                  key={option.role}
                  onClick={() => handleRoleSelect(option.role)}
                  disabled={roleSelecting}
                  className={`btn-modern w-full h-20 justify-start p-6 animate-fadeInUp delay-${index * 100}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      {option.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">{option.title}</div>
                      <div className="text-sm opacity-90">{option.desc}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            {roleSelecting && (
              <div className="flex items-center justify-center mt-8">
                <div className="loading-spinner"></div>
                <span className="ml-3 text-blue-200">Setting up your account...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Modern Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="mobile-container">
          <div className="flex items-center justify-between py-4">
            <div className="text-2xl font-bold text-gradient">Thryve</div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-white/70 hover:text-white transition-colors">Features</Link>
              <Link href="#about" className="text-white/70 hover:text-white transition-colors">About</Link>
              <Link href="#pricing" className="text-white/70 hover:text-white transition-colors">Pricing</Link>
            </div>

            <div className="flex items-center space-x-3">
              {!authMode && (
                <>
                  <Button 
                    onClick={() => setAuthMode('signin')}
                    variant="ghost" 
                    className="btn-modern-small text-white hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => setAuthMode('signup')}
                    className="btn-modern-small bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    Get Started
                  </Button>
                </>
              )}
              {authMode && (
                <Button 
                  onClick={() => {
                    setAuthMode(null)
                    setFormData({ email: '', password: '', confirmPassword: '' })
                  }}
                  variant="ghost" 
                  className="btn-modern-small text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10 mobile-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Hero Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="animate-fadeInUp">
                <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-200 border-blue-400/30 rounded-full px-6 py-2 mb-6">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Join 10,000+ Fitness Enthusiasts
                </Badge>
              </div>
              
              <div className="animate-fadeInUp delay-200">
                <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                  Transform Your
                  <span className="text-gradient block">Fitness Journey</span>
                </h1>
                <p className="text-xl text-blue-200 leading-relaxed max-w-2xl">
                  Discover world-class fitness classes, expert instructors, and a community that motivates you to achieve your goals.
                </p>
              </div>

              <div className="animate-fadeInUp delay-400 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={() => setAuthMode('signup')}
                  className="btn-modern text-lg px-8 py-6 shadow-glow"
                >
                  Start Your Journey
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  onClick={() => setAuthMode('signin')}
                  className="btn-modern-secondary text-lg px-8 py-6"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              {/* Stats */}
              <div className="animate-fadeInUp delay-600 grid grid-cols-2 sm:grid-cols-4 gap-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2 text-blue-400">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-blue-300">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Auth Forms or Features */}
            <div className="animate-fadeInRight delay-800">
              {authMode ? (
                <Card className="card-modern max-w-md mx-auto">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white text-center">
                      {authMode === 'signin' ? 'Welcome Back' : 'Join Thryve Today'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAuth} className="space-y-6">
                      <Input
                        name="email"
                        type="email"
                        placeholder="Your email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input-modern"
                        required
                      />
                      
                      <div className="relative">
                        <Input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Your password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="input-modern pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>

                      {authMode === 'signup' && (
                        <Input
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="input-modern"
                          required
                        />
                      )}

                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="btn-modern w-full"
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner mr-2 w-4 h-4"></div>
                            Processing...
                          </>
                        ) : (
                          authMode === 'signin' ? 'Sign In' : 'Create Account'
                        )}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                          className="text-blue-300 hover:text-white transition-colors"
                        >
                          {authMode === 'signin' 
                            ? "Don't have an account? Sign up" 
                            : "Already have an account? Sign in"
                          }
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-8">
                  {/* Feature Showcase */}
                  <Card className="card-modern p-8">
                    <div className="text-center">
                      <div className="text-blue-400 mb-4">
                        {features[currentFeature].icon}
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {features[currentFeature].title}
                      </h3>
                      <p className="text-blue-200">
                        {features[currentFeature].description}
                      </p>
                    </div>
                    
                    {/* Feature dots */}
                    <div className="flex justify-center space-x-2 mt-6">
                      {features.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentFeature(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentFeature ? 'bg-white w-8' : 'bg-white/30'
                          }`}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-gentle">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-24 relative">
        <div className="mobile-container">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-400/30 rounded-full px-6 py-2 mb-6">
              <Zap className="h-4 w-4 mr-2" />
              Why Choose Thryve
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Everything You Need to
              <span className="text-gradient-secondary block">Stay Motivated</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with expert instruction to deliver an unmatched fitness experience.
            </p>
          </div>

          <div className="mobile-grid animate-on-scroll">
            {features.map((feature, index) => (
              <Card key={index} className={`card-modern p-8 text-center animate-on-scroll delay-${index * 100}`}>
                <div className="text-blue-400 mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-blue-200 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="mobile-container">
          <div className="text-center mb-16 animate-on-scroll">
            <Badge className="bg-gradient-to-r from-green-500/20 to-blue-500/20 text-green-200 border-green-400/30 rounded-full px-6 py-2 mb-6">
              <Heart className="h-4 w-4 mr-2" />
              Community Love
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Loved by
              <span className="text-gradient-accent block">10,000+ Members</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto animate-on-scroll">
            <Card className="card-modern p-12 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-2xl text-white leading-relaxed mb-8">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={testimonials[currentTestimonial].image}
                  alt={testimonials[currentTestimonial].name}
                  className="w-16 h-16 rounded-full ring-4 ring-white/20"
                />
                <div className="text-left">
                  <div className="text-white font-semibold text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-blue-200">
                    {testimonials[currentTestimonial].role}
                  </div>
                </div>
              </div>

              {/* Testimonial dots */}
              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentTestimonial ? 'bg-white w-8' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="mobile-container text-center">
          <div className="animate-on-scroll">
            <div className="animate-pulse-glow mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Ready to Transform
              <span className="text-gradient block">Your Life?</span>
            </h2>
            
            <p className="text-xl text-blue-200 mb-12 max-w-2xl mx-auto">
              Join thousands of members who have already transformed their fitness journey with Thryve.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button 
                onClick={() => setAuthMode('signup')}
                className="btn-modern text-xl px-12 py-6 shadow-glow-hover"
              >
                Start Free Today
                <ArrowRight className="h-6 w-6 ml-2" />
              </Button>
              <Button 
                className="btn-modern-secondary text-xl px-12 py-6"
                onClick={() => toast.info('Demo feature coming soon!')}
              >
                <Play className="h-6 w-6 mr-2" />
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-blue-300">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-400" />
                Free 14-day trial
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-green-400" />
                Cancel anytime
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-green-400" />
                Secure & Private
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="mobile-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-gradient mb-4">Thryve</div>
              <p className="text-blue-200 text-sm leading-relaxed">
                Transform your fitness journey with expert-led classes and a supportive community.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><Link href="/marketplace" className="hover:text-white transition-colors">Browse Classes</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-blue-300 text-sm mb-4 sm:mb-0">
              © 2024 Thryve. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Smartphone className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Heart className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Star className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}