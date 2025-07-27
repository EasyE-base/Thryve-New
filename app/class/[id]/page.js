'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Star, 
  CreditCard, 
  DollarSign,
  Heart,
  Share2,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  Phone,
  Video,
  Dumbbell,
  Target,
  TrendingUp,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  Gift,
  Zap,
  Shield,
  Globe
} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { format, addDays, isToday, isTomorrow } from 'date-fns'

export default function ClassDetailPage() {
  const { user } = useAuth()
  const [classData, setClassData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    description: false,
    requirements: false,
    policy: false
  })
  const [activeTab, setActiveTab] = useState('overview')
  const params = useParams()
  const router = useRouter()

  // Fetch class data from API
  useEffect(() => {
    const fetchClassData = async () => {
      try {
        // In production, this would fetch from API using params.id
        // For now, using enhanced sample data with real structure
        const enhancedClass = {
          id: params.id,
          title: 'Morning Vinyasa Flow - Mindful Movement',
          slug: 'morning-vinyasa-flow-mindful-movement',
          heroImage: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
          gallery: [
            'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
            'https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
            'https://images.unsplash.com/photo-1651077837628-52b3247550ae?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx5b2dhJTIwc3R1ZGlvfGVufDB8fHx8MTc1MzYxNjE5N3ww&ixlib=rb-4.1.0&q=85'
          ],
          instructor: {
            id: 'sarah-johnson',
            name: 'Sarah Johnson',
            bio: 'Certified yoga instructor with 8+ years of experience in vinyasa, hatha, and restorative yoga. Sarah combines traditional yoga philosophy with modern movement science to create transformative experiences.',
            avatar: null,
            specialties: ['Vinyasa Yoga', 'Mindfulness', 'Breathwork', 'Alignment'],
            rating: 4.9,
            reviewCount: 127,
            totalClasses: 340,
            experience: '8+ years',
            certifications: ['RYT-500', 'Yin Yoga', 'Prenatal Yoga'],
            languages: ['English', 'Spanish'],
            responseTime: '2 hours'
          },
          type: 'Yoga',
          category: 'Vinyasa',
          level: 'All Levels',
          intensity: 'Moderate',
          duration: 75,
          price: 35,
          originalPrice: 45,
          rating: 4.8,
          reviewCount: 89,
          totalBookings: 234,
          location: {
            name: 'Harmony Yoga Studio',
            address: '456 Wellness Ave, Downtown',
            city: 'San Francisco',
            state: 'CA',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            isVirtual: false,
            virtualPlatform: null
          },
          description: 'Begin your day with intention and movement in this energizing 75-minute vinyasa flow. This thoughtfully sequenced class weaves together breath-synchronized movement, mindful transitions, and moments of stillness to awaken both body and spirit.\n\nPerfect for practitioners seeking to deepen their yoga journey, this class offers modifications for all levels while maintaining the integrity of a strong vinyasa practice. Each session includes centering meditation, dynamic warm-up, flowing sequences, peak poses, and a deeply restorative cool-down.',
          highlights: [
            'Breath-centered movement',
            'Mindful sequencing',
            'All-level modifications',
            'Meditation integration',
            'Community atmosphere'
          ],
          sessions: [
            {
              id: 'session-1',
              date: addDays(new Date(), 1),
              startTime: '08:00',
              endTime: '09:15',
              spotsTotal: 20,
              spotsBooked: 12,
              isRecurring: true,
              recurringDays: ['Monday', 'Wednesday', 'Friday']
            },
            {
              id: 'session-2',
              date: addDays(new Date(), 2),
              startTime: '08:00',
              endTime: '09:15',
              spotsTotal: 20,
              spotsBooked: 8,
              isRecurring: true,
              recurringDays: ['Monday', 'Wednesday', 'Friday']
            },
            {
              id: 'session-3',
              date: addDays(new Date(), 3),
              startTime: '18:00',
              endTime: '19:15',
              spotsTotal: 25,
              spotsBooked: 18,
              isRecurring: false
            }
          ],
          amenities: [
            'Premium yoga mats provided',
            'Props and blocks available',
            'Filtered water station',
            'Essential oil aromatherapy',
            'Heated studio space',
            'Shower facilities',
            'Secure storage lockers'
          ],
          requirements: [
            'Comfortable, stretchy clothing',
            'Water bottle (BPA-free preferred)',
            'Towel for perspiration',
            'Open mind and positive energy',
            'Arrive 10 minutes early for setup'
          ],
          equipment: [
            'Yoga mat (provided or bring your own)',
            'Yoga blocks (optional)',
            'Yoga strap (optional)',
            'Blanket for final relaxation (provided)'
          ],
          whatToExpect: [
            'Welcome circle and intention setting (5 min)',
            'Centering breath work and meditation (10 min)',
            'Dynamic warm-up sequence (15 min)',
            'Standing and balancing flows (20 min)',
            'Peak pose exploration (10 min)',
            'Cool-down and hip openers (10 min)',
            'Final savasana relaxation (5 min)'
          ],
          benefits: [
            'Increased flexibility and strength',
            'Improved mental clarity and focus',
            'Stress reduction and relaxation',
            'Better posture and alignment',
            'Enhanced mind-body connection',
            'Community and social connection'
          ],
          tags: ['Morning', 'Energizing', 'Mindful', 'Breath Work', 'Flow', 'Community'],
          difficulty: {
            physical: 3,
            mental: 2,
            flexibility: 4,
            strength: 3
          },
          cancellationPolicy: 'Free cancellation up to 4 hours before class start time. Late cancellations (within 4 hours) will result in a 50% credit. No-shows will be charged full price.',
          prerequisites: [],
          contraindications: [
            'Recent surgeries or injuries',
            'Severe cardiac conditions',
            'Pregnancy (without prenatal experience)',
            'Acute inflammation or fever'
          ],
          reviews: [
            {
              id: 1,
              userId: 'user-1',
              userName: 'Emma Rodriguez',
              rating: 5,
              date: '2 days ago',
              comment: 'Sarah creates such a beautiful, welcoming space. Her sequences are challenging yet accessible, and her guidance on breath work has transformed my practice. This class has become an essential part of my week!',
              helpful: 12,
              verified: true,
              attendance: 15
            },
            {
              id: 2,
              userId: 'user-2',
              userName: 'Michael Chen',
              rating: 5,
              date: '1 week ago',
              comment: 'As someone newer to yoga, I appreciate how Sarah offers modifications for every pose. The morning energy in this class is incredible - I always leave feeling centered and ready for my day.',
              helpful: 8,
              verified: true,
              attendance: 6
            },
            {
              id: 3,
              userId: 'user-3',
              userName: 'Lisa Thompson',
              rating: 4,
              date: '2 weeks ago',
              comment: 'Beautiful studio space and Sarah is an excellent teacher. The only reason I didn\'t give 5 stars is that the class can get quite full, making it challenging to have enough personal space.',
              helpful: 5,
              verified: true,
              attendance: 22
            }
          ],
          relatedClasses: [
            { id: 'class-2', title: 'Evening Restorative Yoga', price: 30, rating: 4.7 },
            { id: 'class-3', title: 'Power Vinyasa Flow', price: 40, rating: 4.8 },
            { id: 'class-4', title: 'Yin Yoga & Meditation', price: 25, rating: 4.9 }
          ],
          faqs: [
            {
              question: 'What if I\'m a complete beginner?',
              answer: 'This class welcomes all levels! Sarah provides clear modifications and alternatives for every pose. Arrive a few minutes early to let her know you\'re new, and she\'ll give you extra guidance.'
            },
            {
              question: 'Do I need to bring my own mat?',
              answer: 'High-quality mats are provided, but you\'re welcome to bring your own if you prefer. All props (blocks, straps, bolsters) are included.'
            },
            {
              question: 'What\'s the temperature in the studio?',
              answer: 'The studio is gently heated to 78-82°F (26-28°C) to help warm muscles and deepen stretches. It\'s comfortable, not hot yoga intensity.'
            }
          ]
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800))
        
        setClassData(enhancedClass)
        setSelectedSession(enhancedClass.sessions[0]) // Pre-select first session
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch class data:', error)
        toast.error('Failed to load class details')
        setLoading(false)
      }
    }

    fetchClassData()
  }, [params.id])

  const handleBookClass = async () => {
    if (!user) {
      toast.error('Please sign in to book this class')
      router.push('/?signin=true')
      return
    }

    if (!selectedSession) {
      toast.error('Please select a session first')
      return
    }

    setBookingLoading(true)
    
    try {
      // Create payment intent with real Stripe integration
      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId: classData.id,
          sessionId: selectedSession.id,
          amount: classData.price
        })
      })

      if (paymentResponse.ok) {
        const { clientSecret } = await paymentResponse.json()
        
        // Redirect to Stripe checkout for payment processing
        const { getStripe } = await import('@/lib/stripe')
        const stripe = await getStripe()
        
        if (!stripe) {
          throw new Error('Stripe failed to initialize')
        }

        // Create checkout session for comprehensive payment flow
        const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classId: classData.id,
            sessionId: selectedSession.id,
            className: classData.title,
            sessionTime: `${formatSessionDate(selectedSession.date)} at ${selectedSession.startTime}`,
            amount: classData.price,
            userId: user.uid,
            instructorId: classData.instructor.id
          })
        })

        if (checkoutResponse.ok) {
          const { sessionId } = await checkoutResponse.json()
          
          // Redirect to Stripe Checkout
          const { error } = await stripe.redirectToCheckout({ sessionId })
          
          if (error) {
            console.error('Stripe redirect error:', error)
            throw new Error(error.message)
          }
        } else {
          const errorData = await checkoutResponse.json()
          throw new Error(errorData.error || 'Failed to create checkout session')
        }
      } else {
        const errorData = await paymentResponse.json()
        throw new Error(errorData.error || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(`Failed to process booking: ${error.message}`)
    } finally {
      setBookingLoading(false)
    }
  }

  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited)
    toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites')
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatSessionDate = (date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM dd')
  }

  const getAvailabilityColor = (spotsLeft) => {
    if (spotsLeft === 0) return 'text-red-500'
    if (spotsLeft <= 3) return 'text-orange-500'
    return 'text-green-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-blue-200">Loading class details...</p>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 text-center">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Class not found</h2>
            <p className="text-blue-200 mb-6">The class you're looking for doesn't exist or has been removed.</p>
          </div>
          <Link href="/marketplace">
            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
              Browse Classes
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const selectedSessionSpots = selectedSession ? (selectedSession.spotsTotal - selectedSession.spotsBooked) : 0
  const isSessionFull = selectedSessionSpots <= 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md shadow-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/marketplace">
                <Button variant="ghost" className="text-white hover:text-blue-400 hover:bg-white/10">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleFavoriteToggle}
                className="text-white hover:text-red-400 hover:bg-white/10"
              >
                <Heart className={`h-5 w-5 ${isFavorited ? 'fill-current text-red-400' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:text-blue-400 hover:bg-white/10"
                onClick={() => toast.info('Share feature coming soon!')}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-96 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("${classData.heroImage}")`,
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12">
          <div className="text-white">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className="bg-blue-500/80 text-white backdrop-blur-sm">
                {classData.type}
              </Badge>
              <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                {classData.level}
              </Badge>
              <Badge className="bg-purple-500/80 text-white backdrop-blur-sm">
                {classData.intensity}
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{classData.title}</h1>
            <div className="flex items-center space-x-6 text-lg">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                <span>{classData.rating} ({classData.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                <span>{classData.duration} minutes</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{classData.location.name}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
                <TabsTrigger value="overview" className="text-white data-[state=active]:bg-blue-600">Overview</TabsTrigger>
                <TabsTrigger value="sessions" className="text-white data-[state=active]:bg-blue-600">Sessions</TabsTrigger>
                <TabsTrigger value="reviews" className="text-white data-[state=active]:bg-blue-600">Reviews</TabsTrigger>
                <TabsTrigger value="instructor" className="text-white data-[state=active]:bg-blue-600">Instructor</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-8">
                {/* Description */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      About This Class
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-blue-200 leading-relaxed space-y-4">
                      {classData.description.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                    
                    {classData.highlights && (
                      <div className="mt-6">
                        <h4 className="text-white font-semibold mb-3">Class Highlights</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {classData.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center text-blue-200">
                              <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* What to Expect */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Class Structure
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {classData.whatToExpect.map((item, index) => (
                        <div key={index} className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-1">
                            <span className="text-blue-300 text-sm font-semibold">{index + 1}</span>
                          </div>
                          <p className="text-blue-200">{item}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits & Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Benefits
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {classData.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-start text-blue-200">
                            <Zap className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0 mt-1" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <Info className="h-5 w-5 mr-2" />
                        What to Bring
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {classData.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start text-blue-200">
                            <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0 mt-1" />
                            {requirement}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* FAQ */}
                {classData.faqs && (
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Frequently Asked Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {classData.faqs.map((faq, index) => (
                          <div key={index}>
                            <h4 className="text-white font-semibold mb-2">{faq.question}</h4>
                            <p className="text-blue-200 text-sm leading-relaxed">{faq.answer}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-6 mt-8">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Available Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {classData.sessions.map((session) => {
                        const spotsLeft = session.spotsTotal - session.spotsBooked
                        const isSelected = selectedSession?.id === session.id
                        
                        return (
                          <div 
                            key={session.id}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-400 bg-blue-500/20' 
                                : 'border-white/20 bg-white/5 hover:bg-white/10'
                            }`}
                            onClick={() => setSelectedSession(session)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white font-semibold">
                                  {formatSessionDate(session.date)}
                                </div>
                                <div className="text-blue-200 text-sm">
                                  {session.startTime} - {session.endTime}
                                </div>
                                {session.isRecurring && (
                                  <div className="text-blue-300 text-xs mt-1">
                                    Repeats: {session.recurringDays.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold ${getAvailabilityColor(spotsLeft)}`}>
                                  {spotsLeft} spots left
                                </div>
                                <div className="text-blue-200 text-sm">
                                  of {session.spotsTotal} total
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6 mt-8">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center">
                        <Star className="h-5 w-5 mr-2" />
                        Reviews ({classData.reviewCount})
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">{classData.rating}</div>
                        <div className="text-blue-200 text-sm">average rating</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {classData.reviews.map((review) => (
                        <div key={review.id} className="border-b border-white/10 pb-6 last:border-b-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10 ring-2 ring-blue-400/50">
                                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
                                  {review.userName.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-white">{review.userName}</span>
                                  {review.verified && (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-blue-200">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span>{review.date}</span>
                                  <span>• {review.attendance} classes attended</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-blue-200 leading-relaxed mb-3">{review.comment}</p>
                          <div className="flex items-center space-x-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-200 hover:text-white hover:bg-white/10"
                              onClick={() => toast.info('Helpful vote coming soon!')}
                            >
                              <ThumbsUp className="h-4 w-4 mr-1" />
                              Helpful ({review.helpful})
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Instructor Tab */}
              <TabsContent value="instructor" className="space-y-6 mt-8">
                <Card className="bg-white/10 backdrop-blur-md border-white/20">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-24 w-24 ring-4 ring-blue-400/50">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-2xl">
                          {classData.instructor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-2">{classData.instructor.name}</h2>
                        <div className="flex items-center space-x-4 text-blue-200 mb-4">
                          <div className="flex items-center">
                            <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                            <span>{classData.instructor.rating} ({classData.instructor.reviewCount} reviews)</span>
                          </div>
                          <div className="flex items-center">
                            <Award className="h-5 w-5 mr-1" />
                            <span>{classData.instructor.experience}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-5 w-5 mr-1" />
                            <span>{classData.instructor.totalClasses} classes taught</span>
                          </div>
                        </div>
                        <p className="text-blue-200 leading-relaxed mb-4">{classData.instructor.bio}</p>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-white font-semibold mb-2">Specialties</h4>
                            <div className="flex flex-wrap gap-2">
                              {classData.instructor.specialties.map((specialty, index) => (
                                <Badge key={index} className="bg-blue-500/20 text-blue-200">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-white font-semibold mb-2">Certifications</h4>
                            <div className="flex flex-wrap gap-2">
                              {classData.instructor.certifications.map((cert, index) => (
                                <Badge key={index} className="bg-green-500/20 text-green-200">
                                  <Award className="h-3 w-3 mr-1" />
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex items-center space-x-6">
                          <div className="flex items-center text-blue-200">
                            <Globe className="h-4 w-4 mr-2" />
                            <span>Languages: {classData.instructor.languages.join(', ')}</span>
                          </div>
                          <div className="flex items-center text-blue-200">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>Responds in ~{classData.instructor.responseTime}</span>
                          </div>
                        </div>

                        <div className="mt-6 flex space-x-3">
                          <Link href={`/instructor/${classData.instructor.id}`}>
                            <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                              View Full Profile
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => toast.info('Message feature coming soon!')}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message Instructor
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>Book This Class</span>
                  <div className="text-right">
                    {classData.originalPrice && classData.originalPrice > classData.price && (
                      <div className="text-sm text-blue-300 line-through">${classData.originalPrice}</div>
                    )}
                    <div className="text-3xl font-bold text-white">${classData.price}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Selection */}
                {selectedSession && (
                  <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Selected Session</span>
                      <Badge className="bg-blue-600 text-white">
                        {formatSessionDate(selectedSession.date)}
                      </Badge>
                    </div>
                    <div className="text-blue-200 text-sm">
                      {selectedSession.startTime} - {selectedSession.endTime}
                    </div>
                    <div className={`text-sm font-medium ${getAvailabilityColor(selectedSessionSpots)}`}>
                      {selectedSessionSpots} spots remaining
                    </div>
                  </div>
                )}

                {/* Availability Warning */}
                {selectedSessionSpots <= 5 && selectedSessionSpots > 0 && (
                  <div className="p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg">
                    <div className="flex items-center text-orange-200">
                      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="text-sm">Only {selectedSessionSpots} spots left!</span>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                {isBooked ? (
                  <Button disabled className="w-full bg-green-600 text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Successfully Booked
                  </Button>
                ) : isSessionFull ? (
                  <Button disabled variant="secondary" className="w-full">
                    Session Full - Choose Another
                  </Button>
                ) : !selectedSession ? (
                  <Button disabled variant="secondary" className="w-full">
                    Select a Session First
                  </Button>
                ) : (
                  <Button 
                    onClick={handleBookClass} 
                    disabled={bookingLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Book Now - ${classData.price}
                      </>
                    )}
                  </Button>
                )}

                <div className="text-xs text-center text-blue-300 flex items-center justify-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure payment by Stripe
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Class Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Duration</span>
                  <span className="text-white font-medium">{classData.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Level</span>
                  <span className="text-white font-medium">{classData.level}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Intensity</span>
                  <span className="text-white font-medium">{classData.intensity}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Total Bookings</span>
                  <span className="text-white font-medium">{classData.totalBookings}</span>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Gift className="h-5 w-5 mr-2" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {classData.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center text-sm text-blue-200">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-3 flex-shrink-0" />
                      {amenity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-white font-medium">{classData.location.name}</div>
                  <div className="text-blue-200 text-sm">{classData.location.address}</div>
                  <div className="text-blue-200 text-sm">{classData.location.city}, {classData.location.state}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-white/20 text-white hover:bg-white/10"
                    onClick={() => toast.info('Directions feature coming soon!')}
                  >
                    Get Directions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <button
                  onClick={() => toggleSection('policy')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Cancellation Policy
                  </CardTitle>
                  {expandedSections.policy ? (
                    <ChevronUp className="h-4 w-4 text-white" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white" />
                  )}
                </button>
              </CardHeader>
              {expandedSections.policy && (
                <CardContent>
                  <p className="text-sm text-blue-200 leading-relaxed">{classData.cancellationPolicy}</p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}