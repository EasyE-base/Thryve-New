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
      // Create payment intent
      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify({
          classId: classData.id,
          sessionId: selectedSession.id,
          amount: classData.price
        })
      })

      if (paymentResponse.ok) {
        const { clientSecret } = await paymentResponse.json()
        
        // In a real implementation, you would integrate with Stripe Elements here
        // For now, we'll simulate successful payment
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Create booking
        const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({
            classId: classData.id,
            sessionId: selectedSession.id,
            paymentIntentId: 'pi_simulated_' + Date.now()
          })
        })

        if (bookingResponse.ok) {
          setIsBooked(true)
          toast.success('🎉 Class booked successfully! Check your email for confirmation.')
        } else {
          throw new Error('Booking creation failed')
        }
      } else {
        throw new Error('Payment processing failed')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to book class. Please try again.')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Class not found</h2>
          <p className="text-gray-600 mb-4">The class you're looking for doesn't exist.</p>
          <Link href="/dashboard/customer/explore">
            <Button>Browse Classes</Button>
          </Link>
        </div>
      </div>
    )
  }

  const spotsLeft = classData.capacity - classData.enrolled
  const isFull = spotsLeft <= 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/customer/explore">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Explore
                </Button>
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Class Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{classData.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <Badge variant="secondary">{classData.type}</Badge>
                      <Badge variant="outline">{classData.level}</Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {classData.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">${classData.price}</div>
                    <div className="text-sm text-gray-600">per session</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{classData.description}</p>
              </CardContent>
            </Card>

            {/* Class Details */}
            <Card>
              <CardHeader>
                <CardTitle>Class Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(classData.schedule), 'EEEE, MMMM dd')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Time</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(classData.schedule), 'h:mm a')} ({classData.duration} min)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-gray-600">{classData.location}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium">Capacity</div>
                      <div className="text-sm text-gray-600">
                        {classData.enrolled}/{classData.capacity} spots filled
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor */}
            <Card>
              <CardHeader>
                <CardTitle>Your Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg">
                      {classData.instructor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{classData.instructor.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {classData.instructor.rating}
                      </div>
                      <span>{classData.instructor.totalClasses} classes taught</span>
                    </div>
                    <p className="text-gray-700 mb-3">{classData.instructor.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {classData.instructor.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Bring */}
            <Card>
              <CardHeader>
                <CardTitle>What to Bring</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {classData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Book This Class</span>
                  <div className="text-2xl font-bold text-blue-600">${classData.price}</div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spots Available:</span>
                    <span className={spotsLeft <= 5 ? 'text-red-600 font-medium' : 'text-green-600'}>
                      {spotsLeft} left
                    </span>
                  </div>
                  {spotsLeft <= 5 && spotsLeft > 0 && (
                    <p className="text-xs text-red-600">Hurry! Only {spotsLeft} spots remaining</p>
                  )}
                </div>

                {isBooked ? (
                  <Button disabled className="w-full">
                    ✓ Booked Successfully
                  </Button>
                ) : isFull ? (
                  <Button disabled variant="secondary" className="w-full">
                    Class Full - Join Waitlist
                  </Button>
                ) : (
                  <Button 
                    onClick={handleBookClass} 
                    disabled={bookingLoading}
                    className="w-full"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Book Now
                      </>
                    )}
                  </Button>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Secure payment processed by Stripe
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {classData.amenities.map((amenity, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Cancellation Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Cancellation Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{classData.cancellationPolicy}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}