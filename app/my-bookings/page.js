'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  User, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Heart,
  Award,
  TrendingUp,
  Target,
  Zap,
  ArrowLeft,
  Filter,
  Search,
  MoreVertical,
  Phone,
  MessageCircle,
  Share2,
  Download,
  AlertCircle,
  Sparkles,
  Trophy,
  Fire,
  Timer,
  RefreshCw,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { format, isToday, isTomorrow, isPast, addDays, differenceInHours, differenceInMinutes } from 'date-fns'

export default function MyBookingsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Enhanced mock data for development
  const mockBookings = [
    {
      id: 'booking-1',
      classId: 'morning-vinyasa-flow',
      className: 'Morning Vinyasa Flow - Mindful Movement',
      instructor: {
        id: 'sarah-johnson',
        name: 'Sarah Johnson',
        avatar: null,
        rating: 4.9
      },
      date: addDays(new Date(), 1),
      startTime: '08:00',
      endTime: '09:15',
      duration: 75,
      price: 35,
      status: 'confirmed',
      location: {
        name: 'Harmony Yoga Studio',
        address: '456 Wellness Ave, Downtown',
        city: 'San Francisco'
      },
      bookingDate: new Date(),
      paymentStatus: 'paid',
      canCancel: true,
      canReschedule: true,
      checkedIn: false,
      classType: 'Yoga',
      level: 'All Levels',
      heroImage: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'booking-2',
      classId: 'hiit-cardio-blast',
      className: 'HIIT Cardio Blast - High Energy Workout',
      instructor: {
        id: 'michael-rodriguez',
        name: 'Michael Rodriguez',
        avatar: null,
        rating: 4.8
      },
      date: addDays(new Date(), 3),
      startTime: '18:00',
      endTime: '18:45',
      duration: 45,
      price: 30,
      status: 'confirmed',
      location: {
        name: 'FitCore Studio',
        address: '789 Fitness Blvd, Midtown',
        city: 'San Francisco'
      },
      bookingDate: new Date(),
      paymentStatus: 'paid',
      canCancel: true,
      canReschedule: true,
      checkedIn: false,
      classType: 'HIIT',
      level: 'Intermediate',
      heroImage: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHw0fHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85'
    },
    {
      id: 'booking-3',
      classId: 'strength-training-basics',
      className: 'Strength Training Basics - Build Foundation',
      instructor: {
        id: 'david-wilson',
        name: 'David Wilson',
        avatar: null,
        rating: 4.6
      },
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      startTime: '10:00',
      endTime: '10:50',
      duration: 50,
      price: 35,
      status: 'completed',
      location: {
        name: 'Iron Works Gym',
        address: '321 Power Ave, Westside',
        city: 'San Francisco'
      },
      bookingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      paymentStatus: 'paid',
      canCancel: false,
      canReschedule: false,
      checkedIn: true,
      classType: 'Strength',
      level: 'Beginner',
      heroImage: 'https://images.unsplash.com/photo-1591258370814-01609b341790?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxmaXRuZXNzJTIwY2xhc3N8ZW58MHx8fHwxNzUzNjE2MTkxfDA&ixlib=rb-4.1.0&q=85',
      rating: 5,
      review: 'Great class! David is an excellent instructor and really helped me with proper form.'
    }
  ]

  useEffect(() => {
    const fetchBookings = async () => {
      // Wait for authentication to be fully loaded
      if (authLoading) {
        console.log('🔄 My Bookings: Waiting for auth to load...')
        return
      }

      if (!user) {
        console.log('🔄 My Bookings: No user, redirecting to signin...')
        router.push('/?signin=true')
        return
      }

      // Check if user has a role - if not, they might need to complete role selection
      if (!role) {
        console.log('🔄 My Bookings: No role found, checking localStorage...')
        
        // Try to get role from localStorage as fallback
        if (typeof window !== 'undefined') {
          const tempUserData = localStorage.getItem('tempUserData')
          if (tempUserData) {
            try {
              const parsedData = JSON.parse(tempUserData)
              if (parsedData.uid === user.uid && parsedData.role) {
                console.log('🔄 My Bookings: Found role in localStorage, proceeding...')
                // Continue with fetching
              } else {
                console.log('🔄 My Bookings: No valid role found, redirecting to role selection...')
                router.push('/?roleSelection=true')
                return
              }
            } catch (e) {
              console.log('🔄 My Bookings: Error parsing localStorage, redirecting to signin...')
              router.push('/?signin=true')
              return
            }
          } else {
            console.log('🔄 My Bookings: No localStorage data, redirecting to signin...')
            router.push('/?signin=true')
            return
          }
        }
      }

      setLoading(true)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/bookings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
        })

        if (response.ok) {
          const data = await response.json()
          setBookings(data.bookings || [])
        } else if (response.status === 401) {
          console.log('🔄 My Bookings: Authentication failed, redirecting to signin...')
          router.push('/?signin=true')
          return
        } else {
          throw new Error('Failed to fetch bookings')
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error)
        toast.error('Failed to load your bookings')
        // Fallback to mock data for development
        await new Promise(resolve => setTimeout(resolve, 1000))
        setBookings(mockBookings)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, role, authLoading, router])

  const upcomingBookings = bookings.filter(booking => 
    !isPast(new Date(`${format(booking.date, 'yyyy-MM-dd')} ${booking.endTime}`)) && 
    booking.status !== 'cancelled'
  )

  const pastBookings = bookings.filter(booking => 
    isPast(new Date(`${format(booking.date, 'yyyy-MM-dd')} ${booking.endTime}`)) || 
    booking.status === 'completed'
  )

  const cancelledBookings = bookings.filter(booking => booking.status === 'cancelled')

  const filteredBookings = (bookings) => {
    if (!searchQuery) return bookings
    return bookings.filter(booking => 
      booking.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.classType.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const getBookingStatusColor = (booking) => {
    if (booking.status === 'cancelled') return 'bg-red-500/20 text-red-300 border-red-400/30'
    if (booking.status === 'completed') return 'bg-green-500/20 text-green-300 border-green-400/30'
    if (isToday(booking.date)) return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
  }

  const getBookingStatusText = (booking) => {
    if (booking.status === 'cancelled') return 'Cancelled'
    if (booking.status === 'completed') return 'Completed'
    if (isToday(booking.date)) return 'Today'
    if (isTomorrow(booking.date)) return 'Tomorrow'
    return 'Upcoming'
  }

  const getTimeUntilClass = (booking) => {
    const classDateTime = new Date(`${format(booking.date, 'yyyy-MM-dd')} ${booking.startTime}`)
    const now = new Date()
    const hoursUntil = differenceInHours(classDateTime, now)
    const minutesUntil = differenceInMinutes(classDateTime, now)

    if (minutesUntil <= 0) return 'Started'
    if (hoursUntil < 1) return `${minutesUntil}m`
    if (hoursUntil < 24) return `${hoursUntil}h`
    return `${Math.floor(hoursUntil / 24)}d`
  }

  const handleCancelBooking = async (bookingId) => {
    if (!user) return
    
    setActionLoading(bookingId)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled', canCancel: false, canReschedule: false }
            : booking
        ))
        
        toast.success('✅ Class cancelled successfully!')
        toast.info(data.refund || 'Refund will be processed within 3-5 business days')
      } else if (response.status === 400) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Cannot cancel this booking')
      } else if (response.status === 404) {
        toast.error('Booking not found')
      } else {
        throw new Error('Failed to cancel booking')
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCheckIn = async (bookingId) => {
    setActionLoading(bookingId)
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/server-api/bookings/${bookingId}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, checkedIn: true, checkedInAt: new Date() }
            : booking
        ))
        
        toast.success('🎉 Checked in successfully!')
      } else if (response.status === 400) {
        const errorData = await response.json()
        toast.error(errorData.error || 'Cannot check in at this time')
      } else if (response.status === 404) {
        toast.error('Booking not found')
      } else {
        throw new Error('Failed to check in')
      }
    } catch (error) {
      console.error('Failed to check in:', error)
      toast.error('Failed to check in. Please try again.')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'MMM dd, yyyy')
  }

  const BookingCard = ({ booking, showActions = true }) => (
    <Card className="card-modern overflow-hidden animate-fadeInUp">
      <div 
        className="relative h-32 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url("${booking.heroImage}")`,
        }}
      >
        <div className="absolute top-3 left-3 flex space-x-2">
          <Badge className={`${getBookingStatusColor(booking)} backdrop-blur-sm font-medium`}>
            {getBookingStatusText(booking)}
          </Badge>
          {booking.status !== 'cancelled' && booking.status !== 'completed' && (
            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm">
              <Timer className="h-3 w-3 mr-1" />
              {getTimeUntilClass(booking)}
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3">
          {booking.checkedIn && (
            <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
              <CheckCircle className="h-3 w-3 mr-1" />
              Checked In
            </Badge>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{booking.className}</h3>
          <div className="flex items-center text-blue-200 text-sm">
            <User className="h-3 w-3 mr-1" />
            {booking.instructor.name}
            <Star className="h-3 w-3 ml-2 mr-1 text-yellow-400 fill-current" />
            {booking.instructor.rating}
          </div>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-blue-200">
            <Calendar className="h-4 w-4 mr-2 text-blue-400" />
            <div>
              <div className="text-white font-medium">{formatDate(booking.date)}</div>
              <div className="text-xs">{booking.startTime} - {booking.endTime}</div>
            </div>
          </div>
          <div className="flex items-center text-blue-200">
            <MapPin className="h-4 w-4 mr-2 text-blue-400" />
            <div>
              <div className="text-white font-medium">{booking.location.name}</div>
              <div className="text-xs">{booking.location.city}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Badge className="bg-blue-500/20 text-blue-200 text-xs border border-blue-400/30">
              {booking.classType}
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-200 text-xs border border-purple-400/30">
              {booking.level}
            </Badge>
          </div>
          <div className="text-xl font-bold text-gradient">${booking.price}</div>
        </div>

        {booking.rating && booking.review && (
          <div className="p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < booking.rating ? 'text-yellow-400 fill-current' : 'text-gray-400'
                    }`}
                  />
                ))}
              </div>
              <span className="text-white font-medium ml-2">Your Review</span>
            </div>
            <p className="text-blue-200 text-sm">{booking.review}</p>
          </div>
        )}

        {showActions && (
          <div className="flex space-x-2 pt-2">
            {booking.status === 'confirmed' && !booking.checkedIn && !isPast(booking.date) && (
              <>
                <Button
                  onClick={() => handleCheckIn(booking.id)}
                  disabled={actionLoading === booking.id}
                  className="btn-modern-small bg-gradient-to-r from-green-500 to-green-600 flex-1 text-xs"
                >
                  {actionLoading === booking.id ? (
                    <div className="loading-spinner w-3 h-3 mr-1"></div>
                  ) : (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  )}
                  Check In
                </Button>
                {booking.canCancel && (
                  <Button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={actionLoading === booking.id}
                    variant="outline"
                    className="btn-modern-small border-red-400/30 text-red-300 hover:bg-red-500/10 flex-1 text-xs"
                  >
                    {actionLoading === booking.id ? (
                      <div className="loading-spinner w-3 h-3 mr-1"></div>
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    Cancel
                  </Button>
                )}
              </>
            )}
            
            {booking.status === 'completed' && !booking.rating && (
              <Button
                className="btn-modern-small bg-gradient-to-r from-yellow-500 to-yellow-600 flex-1 text-xs"
                onClick={() => toast.info('Rating feature coming soon!')}
              >
                <Star className="h-3 w-3 mr-1" />
                Rate Class
              </Button>
            )}

            <Link href={`/class/${booking.classId}`} className="flex-1">
              <Button
                variant="outline"
                className="btn-modern-small border-white/20 text-white hover:bg-white/10 w-full text-xs"
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                View Details
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-16 h-16 mx-auto mb-4"></div>
          <p className="text-blue-200">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Modern Header */}
      <header className="bg-black/20 backdrop-blur-xl shadow-modern border-b border-white/10 sticky top-0 z-50">
        <div className="mobile-container">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => router.back()}
                variant="ghost" 
                className="btn-modern-small text-white hover:bg-white/10 p-3 rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="animate-fadeInLeft">
                <h1 className="text-3xl font-bold text-gradient flex items-center">
                  <Trophy className="h-8 w-8 mr-2" />
                  My Bookings
                </h1>
                <p className="text-sm text-blue-200">Your fitness journey dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                className="btn-modern-small border-white/20 text-white hover:bg-white/10 hidden md:flex"
                onClick={() => toast.info('Export feature coming soon!')}
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-container py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fadeInUp">
          <Card className="card-modern p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {upcomingBookings.length}
            </div>
            <div className="text-blue-200 text-sm">Upcoming</div>
          </Card>
          <Card className="card-modern p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {pastBookings.filter(b => b.status === 'completed').length}
            </div>
            <div className="text-blue-200 text-sm">Completed</div>
          </Card>
          <Card className="card-modern p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              {pastBookings.filter(b => b.checkedIn).length}
            </div>
            <div className="text-blue-200 text-sm">Checked In</div>
          </Card>
          <Card className="card-modern p-4 text-center">
            <div className="text-2xl font-bold text-gradient mb-1">
              ${bookings.reduce((sum, b) => sum + (b.paymentStatus === 'paid' ? b.price : 0), 0)}
            </div>
            <div className="text-blue-200 text-sm">Total Spent</div>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8 animate-fadeInUp delay-200">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50" />
          <input
            type="text"
            placeholder="Search your bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-modern pl-12 w-full"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fadeInUp delay-300">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-md rounded-full">
            <TabsTrigger 
              value="upcoming" 
              className="rounded-full text-white data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Timer className="h-4 w-4 mr-2" />
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="rounded-full text-white data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled" 
              className="rounded-full text-white data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6 mt-8">
            {filteredBookings(upcomingBookings).length === 0 ? (
              <Card className="card-modern p-12 text-center">
                <Sparkles className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No upcoming bookings</h3>
                <p className="text-blue-200 mb-6">Ready to book your next fitness adventure?</p>
                <Link href="/marketplace">
                  <Button className="btn-modern">
                    <Search className="h-4 w-4 mr-2" />
                    Browse Classes
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredBookings(upcomingBookings).map((booking, index) => (
                  <div key={booking.id} className={`animate-fadeInUp delay-${index * 100}`}>
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6 mt-8">
            {filteredBookings(pastBookings).length === 0 ? (
              <Card className="card-modern p-12 text-center">
                <Trophy className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No past bookings yet</h3>
                <p className="text-blue-200">Your fitness history will appear here.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredBookings(pastBookings).map((booking, index) => (
                  <div key={booking.id} className={`animate-fadeInUp delay-${index * 100}`}>
                    <BookingCard booking={booking} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-6 mt-8">
            {filteredBookings(cancelledBookings).length === 0 ? (
              <Card className="card-modern p-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No cancelled bookings</h3>
                <p className="text-blue-200">Great job staying committed to your fitness goals!</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredBookings(cancelledBookings).map((booking, index) => (
                  <div key={booking.id} className={`animate-fadeInUp delay-${index * 100}`}>
                    <BookingCard booking={booking} showActions={false} />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}